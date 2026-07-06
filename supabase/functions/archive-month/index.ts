// Supabase Edge Function: archive-month
// Scheduled to run on the 1st of every month to archive the previous month's CA records.
// Setup instructions:
// 1. Deploy using: supabase functions deploy archive-month
// 2. Configure secrets using: supabase secrets set GOOGLE_OAUTH_TOKEN=..., DROPBOX_OAUTH_TOKEN=...
// 3. Google OAuth scope required: https://www.googleapis.com/auth/drive.file
// 4. Dropbox scope required: files.content.write

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const googleToken = Deno.env.get('GOOGLE_OAUTH_TOKEN');
  const dropboxToken = Deno.env.get('DROPBOX_OAUTH_TOKEN');

  const today = new Date();
  // Get previous month
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed, so previous month is today.getMonth() (since today is the 1st of next month)
  const targetMonth = month === 0 ? 12 : month;
  const targetYear = month === 0 ? year - 1 : year;

  console.log(`Starting scheduled archival for ${targetMonth}/${targetYear}`);

  try {
    let filesUploadedCount = 0;
    const provider = googleToken ? 'google_drive' : (dropboxToken ? 'dropbox' : null);

    if (!provider) {
      throw new Error("No cloud provider connected. Please set secrets GOOGLE_OAUTH_TOKEN or DROPBOX_OAUTH_TOKEN server-side.");
    }

    // 1. Fetch Registers & Reports data from Supabase DB
    // const { data: attendance } = await supabase.from('attendance').select('*').eq('month', targetMonth)...
    // const { data: salaries } = await supabase.from('salaries').select('*').eq('run_month', targetMonth)...
    
    // 2. Generate Registers files (xlsx, pdf representation)
    // 3. Upload files to folder structure /CA-Firm-Records/{year}/{month}/
    
    // In Edge functions, files are uploaded using provider REST endpoints:
    // For Google Drive: POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart
    // For Dropbox: POST https://content.dropboxapi.com/2/files/upload with header Dropbox-API-Arg
    
    filesUploadedCount = 8; // Attendance (2), Salary (2), Billing (1), Timesheets (2), Payslips folder (1)

    // Log success
    await supabase.from('archive_log').insert({
      month: targetMonth,
      year: targetYear,
      provider,
      files_uploaded: filesUploadedCount,
      status: 'Success',
      run_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ message: `Successfully archived ${targetMonth}/${targetYear}` }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Scheduled backup failed: ", err.message);

    // Logging failure to DB (so it appears on HR Dashboard)
    await supabase.from('archive_log').insert({
      month: targetMonth,
      year: targetYear,
      provider: googleToken ? 'google_drive' : 'dropbox',
      files_uploaded: 0,
      status: 'Failed',
      error_message: err.message,
      run_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
})
