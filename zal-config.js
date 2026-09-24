// ZAL → Supabase connection.
// The publishable key is designed to be public: it only grants what the
// Row Level Security policies in supabase/schema.sql allow.
// NEVER put the service_role / secret key in this file or any browser code.
window.ZAL_SUPABASE = {
  url: "https://lhvnhmkhnwxwadpqabsd.supabase.co",
  // Paste the FULL publishable key here (Supabase → Project Settings → API Keys).
  key: "sb_publishable_tOAhtoW8FRKCs5WMQOFqEw_K7nUbwdw"
};
