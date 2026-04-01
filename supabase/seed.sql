-- Sample organizations
INSERT INTO organizations (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Abakus'),
  ('00000000-0000-0000-0000-000000000002', 'Janus'),
  ('00000000-0000-0000-0000-000000000003', 'Online')
ON CONFLICT (id) DO NOTHING;

-- Sample pins
INSERT INTO pins (id, name, description, organization_id, edition_size, released_at) VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    'Abakus 50 År',
    'Jubileumspinne for 50 år med IT-studenter på NTNU.',
    '00000000-0000-0000-0000-000000000001',
    100,
    '2024-01-15'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    'Abakus Revyen 2024',
    'Spesialpinne til årets Abakusrevy.',
    '00000000-0000-0000-0000-000000000001',
    50,
    '2024-03-01'
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    'Janus Klassiker',
    'Den ikoniske originalpinnen fra Janus.',
    '00000000-0000-0000-0000-000000000002',
    200,
    '2023-09-01'
  ),
  (
    '00000000-0000-0000-0001-000000000004',
    'Janus Nyttår 2024',
    'Begrenset nyttårspinne fra Janus.',
    '00000000-0000-0000-0000-000000000002',
    75,
    '2024-01-01'
  ),
  (
    '00000000-0000-0000-0001-000000000005',
    'Online Logopinne',
    'Originalpinnen med Online-logoen i emalje.',
    '00000000-0000-0000-0000-000000000003',
    150,
    '2023-08-15'
  ),
  (
    '00000000-0000-0000-0001-000000000006',
    'Online Julepinne 2023',
    'Begrenset julepinne fra Online, kun 60 stykk.',
    '00000000-0000-0000-0000-000000000003',
    60,
    '2023-12-01'
  ),
  (
    '00000000-0000-0000-0001-000000000007',
    'Abakus x Online Samarbeidspinne',
    'Eksklusiv samarbeidspinne mellom Abakus og Online. Kun 30 stykk laget.',
    NULL,
    30,
    '2024-02-14'
  )
ON CONFLICT (id) DO NOTHING;
