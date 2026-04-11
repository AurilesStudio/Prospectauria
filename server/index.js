const express = require('express');
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// CRUD Mini-CRM
app.get('/api/prospects', async (req, res) => {
  const { data, error } = await supabase.from('prospects').select('*');
  if (error) return res.status(500).json(error);
  res.json(data);
});

app.post('/api/prospects', async (req, res) => {
  const { data, error } = await supabase.from('prospects').insert([req.body]);
  if (error) return res.status(500).json(error);
  res.json(data);
});

app.patch('/api/prospects/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('prospects')
    .update(req.body)
    .eq('id', req.params.id);
  if (error) return res.status(500).json(error);
  res.json(data);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
