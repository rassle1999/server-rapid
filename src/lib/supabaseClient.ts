import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fjqonjmqybrlexnrqjuy.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqcW9uam1xeWJybGV4bnJxanV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDc1OTcsImV4cCI6MjA3NjE4MzU5N30.nJBtl3d_uCo-9W9EPNgakoeGmNupzv8RTV2gmlbvAk8";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;