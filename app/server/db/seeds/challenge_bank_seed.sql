-- ============================================================================
-- challenge_bank_seed.sql
-- Fallback challenge bank — used when AI generation fails. 10 EN + 10 BG.
-- Style follows the examples in docs/AI_GENERATION.md: short, specific,
-- actionable. Two per category, mix of easy + medium.
-- Apply after migration 003_challenge_bank.sql.
-- ============================================================================

INSERT INTO challenge_bank
  (title, description, category, difficulty, duration_min, points, language, is_active)
VALUES
  -- ----- English -----
  ('Phone-free walk for 20 minutes',
   'Leave your phone behind and walk outside. Notice three things you have not seen before.',
   'health', 'easy', 20, 15, 'en', TRUE),

  ('Drink 2L of water before noon',
   'Hydration improves focus and energy by up to 20%.',
   'health', 'easy', 5, 15, 'en', TRUE),

  ('Write 3 things you are grateful for',
   'Gratitude practice reduces stress and improves mood within minutes.',
   'mental', 'easy', 5, 15, 'en', TRUE),

  ('Meditate for 15 minutes',
   'Sit quietly and follow your breath. A short daily practice lowers anxiety and sharpens attention.',
   'mental', 'medium', 15, 25, 'en', TRUE),

  ('Read 10 pages of a book',
   'Consistent reading builds discipline and expands your perspective.',
   'productivity', 'easy', 15, 15, 'en', TRUE),

  ('Do a 20-minute deep work block',
   'Pick one task, silence notifications, and work without interruption for 20 minutes.',
   'productivity', 'medium', 20, 25, 'en', TRUE),

  ('Send a thoughtful message to a friend',
   'Tell them what you appreciate about them. It costs nothing and lifts both of you.',
   'social', 'easy', 5, 15, 'en', TRUE),

  ('Call someone you have not spoken to in a month',
   'Reconnect properly. A voice call beats a text for closeness.',
   'social', 'medium', 15, 25, 'en', TRUE),

  ('Log every expense from yesterday',
   'Awareness is the first step to better spending. Just write them down.',
   'finance', 'easy', 5, 15, 'en', TRUE),

  ('Cancel one unused subscription',
   'Find a service you no longer use and cancel it today. Small wins compound.',
   'finance', 'medium', 10, 25, 'en', TRUE),

  -- ----- Bulgarian -----
  ('Разходка без телефон — 20 минути',
   'Остави телефона и излез на разходка. Забележи три неща, които не си виждал преди.',
   'health', 'easy', 20, 15, 'bg', TRUE),

  ('Изпий 2л вода до обяд',
   'Хидратацията подобрява концентрацията и енергията с до 20%.',
   'health', 'easy', 5, 15, 'bg', TRUE),

  ('Напиши 3 неща, за които си благодарен',
   'Практиката на благодарност намалява стреса и подобрява настроението за минути.',
   'mental', 'easy', 5, 15, 'bg', TRUE),

  ('Медитирай 15 минути',
   'Седни в тишина и следи дишането си. Кратката ежедневна практика намалява тревожността и заостря вниманието.',
   'mental', 'medium', 15, 25, 'bg', TRUE),

  ('Прочети 10 страници от книга',
   'Последователното четене изгражда дисциплина и разширява перспективата ти.',
   'productivity', 'easy', 15, 15, 'bg', TRUE),

  ('Направи 20-минутен блок за дълбок фокус',
   'Избери една задача, изключи известията и работи без прекъсване 20 минути.',
   'productivity', 'medium', 20, 25, 'bg', TRUE),

  ('Изпрати топло съобщение на приятел',
   'Кажи му какво цениш в него. Нищо не струва, а повдига и двамата.',
   'social', 'easy', 5, 15, 'bg', TRUE),

  ('Обади се на човек, с когото не си говорил повече от месец',
   'Свържете се истински. Гласовото обаждане сближава повече от текст.',
   'social', 'medium', 15, 25, 'bg', TRUE),

  ('Запиши всичките си разходи от вчера',
   'Осъзнатостта е първата стъпка към по-добри финанси. Просто ги запиши.',
   'finance', 'easy', 5, 15, 'bg', TRUE),

  ('Откажи един ненужен абонамент',
   'Намери услуга, която вече не ползваш, и я отмени днес. Малките победи се натрупват.',
   'finance', 'medium', 10, 25, 'bg', TRUE);
