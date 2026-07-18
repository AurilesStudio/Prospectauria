#!/usr/bin/env python3
"""Reconstruit data/pals.json, data/breeding.json, data/meta.json (+ images) pour Palworld Tracker.

Sources :
  - PalCalc (tylercamp)  -> roster 1.0, stats, breeding power, noms FR, rareté, aptitudes
  - Paldex (blaynem)     -> éléments, drops, compétences de partenaire (FR)
  - mlg404 paldex-api    -> table de breeding + images (137 Pals d'origine)

Usage :
  python3 scripts/build.py            # reconstruit data/*.json (garde les images existantes)
  python3 scripts/build.py --images   # + retélécharge/redimensionne les images disponibles

Le wiki/CDN d'images n'étant pas toujours accessibles, les images ne couvrent que les
Pals présents chez mlg404 ; les autres utilisent une vignette générique dans l'app.
"""
import json, os, re, sys, io, urllib.request, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
ASSETS = os.path.join(ROOT, 'assets', 'pals')

SRC = {
    'palcalc': 'https://raw.githubusercontent.com/tylercamp/palcalc/master/PalCalc.Model/db.json',
    'blaynem': 'https://raw.githubusercontent.com/blaynem/paldex/main/data-provider/baked-data/en/pals.json',
    'blaynem_fr': 'https://raw.githubusercontent.com/blaynem/paldex/main/data-provider/baked-data/fr/pals.json',
    'mlg_breeding': 'https://raw.githubusercontent.com/mlg404/palworld-paldex-api/main/src/breeding.json',
    'mlg_pals': 'https://raw.githubusercontent.com/mlg404/palworld-paldex-api/main/src/pals.json',
    'mlg_img': 'https://raw.githubusercontent.com/mlg404/palworld-paldex-api/main/public/images/paldeck/{key}.png',
}

WORK_MAP = {
    'Kindling': 'kindling', 'Watering': 'watering', 'Planting': 'planting',
    'GenerateElectricity': 'generating_electricity', 'Handiwork': 'handiwork',
    'Gathering': 'gathering', 'Lumbering': 'lumbering', 'Mining': 'mining',
    'MedicineProduction': 'medicine_production', 'Cooling': 'cooling',
    'Transporting': 'transporting', 'Farming': 'farming',
}
ELEMS = {'Neutral': 'neutral', 'Fire': 'fire', 'Water': 'water', 'Electric': 'electric',
         'Grass': 'grass', 'Dark': 'dark', 'Dragon': 'dragon', 'Ground': 'ground', 'Ice': 'ice'}
SUFFIX_EL = {'Fire': 'fire', 'Ice': 'ice', 'Electric': 'electric', 'Water': 'water',
             'Ground': 'ground', 'Dark': 'dark', 'Dragon': 'dragon', 'Leaf': 'grass',
             'Grass': 'grass', 'Neutral': 'neutral'}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=60).read()


def get_json(url):
    return json.loads(get(url))


def key_of(p):
    n = p['Id']['PalDexNo']
    return f"{n:03d}" + ("B" if p['Id']['IsVariant'] else "")


def main():
    do_images = '--images' in sys.argv
    print('Téléchargement des sources…')
    pc = get_json(SRC['palcalc'])
    bl_en = get_json(SRC['blaynem'])
    bl_fr = get_json(SRC['blaynem_fr'])
    mlg_breeding = get_json(SRC['mlg_breeding'])
    mlg_pals = get_json(SRC['mlg_pals'])
    pals = pc['Pals']

    blen_name = {b['pal_name']: b for b in bl_en}
    blen_dev = {b['pal_dev_name']: b for b in bl_en}
    blfr_by_en = {be['pal_name']: bf for be, bf in zip(bl_en, bl_fr)}

    base_el = {}
    for p in pals:
        if not p['Id']['IsVariant']:
            b = blen_name.get(p['Name']) or blen_dev.get(p['InternalName'])
            if b and b.get('elements'):
                base_el[p['Id']['PalDexNo']] = [ELEMS.get(e, e.lower()) for e in b['elements']]

    def infer_elements(p):
        b = blen_name.get(p['Name']) or blen_dev.get(p['InternalName'])
        if b and b.get('elements'):
            return [ELEMS.get(e, e.lower()) for e in b['elements']], 'data'
        if p['Id']['IsVariant']:
            els = list(base_el.get(p['Id']['PalDexNo'], []))
            m = re.search(r'_(\w+)$', p['InternalName'])
            if m and m.group(1) in SUFFIX_EL:
                se = SUFFIX_EL[m.group(1)]
                if se not in els:
                    els.append(se)
            if els:
                return els, 'inferred'
        return [], 'unknown'

    out = []
    for p in pals:
        dex = p['Id']['PalDexNo']
        b_en = blen_name.get(p['Name']) or blen_dev.get(p['InternalName'])
        b_fr = blfr_by_en.get(p['Name'])
        els, el_src = infer_elements(p)
        suit = [{'type': WORK_MAP[w], 'level': lv} for w, lv in p['WorkSuitability'].items() if lv and lv > 0]
        suit.sort(key=lambda s: -s['level'])
        ps_name = ps_desc = None
        for src in (b_fr, b_en):
            if src and src.get('partner_skill_title'):
                ps_name = src['partner_skill_title']; ps_desc = src.get('partner_skill_description'); break
        desc = (b_fr.get('pal_description') if b_fr else None) or ''
        if desc == 'Missing...':
            desc = ''
        atk_m = p['Attack']; atk_r = p['Attack']
        if b_en and b_en.get('stats'):
            atk_m = b_en['stats'].get('melee_attack') or atk_m
            atk_r = b_en['stats'].get('shot_attack') or atk_r
        out.append({
            'key': key_of(p), 'id': dex, 'name': p['LocalizedNames'].get('fr') or p['Name'],
            'nameEn': p['Name'], 'types': els, 'elementSource': el_src,
            'suitability': suit,
            'stats': {'hp': p['Hp'], 'atkMelee': atk_m, 'atkRanged': atk_r, 'defense': p['Defense'],
                      'rideSpeed': p['RideSprintSpeed'], 'runSpeed': p['RunSpeed'],
                      'stamina': p['Stamina'], 'food': p['FoodAmount']},
            'drops': (b_en.get('item_drops') if b_en else []) or [],
            'rarity': p['Rarity'], 'genus': (b_en.get('genus_category').lower() if b_en and b_en.get('genus_category') else 'other'),
            'size': (p['Size'] or '').lower(),
            'partnerSkill': {'name': ps_name, 'description': ps_desc}, 'description': desc,
            'isVariant': p['Id']['IsVariant'], 'predator': bool(b_en.get('predator')) if b_en else False,
            'nocturnal': bool(p.get('Nocturnal')), 'wildLevel': [p.get('MinWildLevel'), p.get('MaxWildLevel')],
            'hasImage': False, 'hasBreeding': False,
        })
    out_by_en = {o['nameEn']: o for o in out}

    # Pont mlg404 (numérotation propre) -> nos clés (par nom)
    bridge = {}
    for mp in mlg_pals:
        m = out_by_en.get(mp['name'])
        if m:
            bridge[mp['key']] = m['key']

    # Images
    if do_images:
        try:
            from PIL import Image
        except ImportError:
            print('Pillow absent : images non régénérées. `pip install Pillow`'); do_images = False
    if do_images:
        tmp = ASSETS + '_tmp'
        shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
        n = 0
        for mk, myk in bridge.items():
            try:
                raw = get(SRC['mlg_img'].format(key=mk))
                im = Image.open(io.BytesIO(raw)).convert('RGBA')
                im.thumbnail((200, 200), Image.LANCZOS)
                im.save(os.path.join(tmp, myk + '.png'), optimize=True); n += 1
            except Exception as e:
                print('  image KO', mk, e)
        shutil.rmtree(ASSETS, ignore_errors=True); shutil.move(tmp, ASSETS)
        print(f'{n} images (ré)générées')

    img_keys = {f[:-4] for f in os.listdir(ASSETS)} if os.path.isdir(ASSETS) else set()

    # Breeding remappé vers nos clés
    new_breeding = {}
    for child, prs in mlg_breeding.items():
        cm = bridge.get(child)
        if not cm:
            continue
        np = [[bridge[a], bridge[b]] for a, b in prs if a in bridge and b in bridge]
        if np:
            new_breeding[cm] = np
    breed_keys = set(new_breeding) | {k for ps in new_breeding.values() for pr in ps for k in pr}

    for o in out:
        o['hasImage'] = o['key'] in img_keys
        o['hasBreeding'] = o['key'] in breed_keys

    os.makedirs(DATA, exist_ok=True)
    json.dump(out, open(os.path.join(DATA, 'pals.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    json.dump(new_breeding, open(os.path.join(DATA, 'breeding.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    meta = {
        'datasetBuild': __import__('datetime').date.today().isoformat(),
        'palworldVersion': '1.0',
        'counts': {'pals': len(out), 'withImage': sum(o['hasImage'] for o in out),
                   'withElement': sum(1 for o in out if o['types']),
                   'withBreeding': sum(o['hasBreeding'] for o in out)},
        'sources': {'palcalc': {'url': SRC['palcalc'], 'version': pc.get('Version')},
                    'blaynem': {'url': SRC['blaynem']}},
    }
    json.dump(meta, open(os.path.join(DATA, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
    print('OK :', meta['counts'], 'PalCalc', pc.get('Version'))


if __name__ == '__main__':
    main()
