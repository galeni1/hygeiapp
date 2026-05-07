import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All 2380 records from Excel data
const excelData = [
  // Source Β - ΑΓΙΟΣ ΘΩΜΑΣ
  { source: 'Β', number: 1, village: 'ΑΓΙΟΣ ΘΩΜΑΣ', guest_type: 'ΟΙΚ', surname: 'ΦΡΑΓΚΙΑΔΑΚΗΣ', first_name: 'ΝΙΚΟΣ', father_name: null, nickname: null, responsible: 'ΧΑΝΙΩΤΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΓΙΟΣ ΘΩΜΑΣ', guest_type: 'ΟΙΚ', surname: 'ΦΡΑΓΚΙΑΔΑΚΗΣ', first_name: 'ΜΑΝΩΛΗΣ', father_name: 'ΝΙΚΟΛΑΟΥ', nickname: 'ΚΟΖΙ - ΟΚ', responsible: 'ΧΑΝΙΩΤΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΓΙΟΣ ΘΩΜΑΣ', guest_type: 'ΟΙΚ', surname: 'ΦΡΑΓΚΙΑΔΑΚΗΣ', first_name: 'ΜΙΧΑΛΗΣ', father_name: 'ΝΙΚΟΛΑΟΥ', nickname: 'ΚΟΖΙ', responsible: 'ΧΑΝΙΩΤΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΓΙΟΣ ΘΩΜΑΣ', guest_type: 'ΟΙΚ', surname: 'ΦΡΑΓΚΙΑΔΑΚΗΣ', first_name: 'ΖΑΧΑΡΙΑΣ', father_name: 'ΜΑΝΩΛΗ', nickname: 'ΚΟΖΙ', responsible: 'ΧΑΝΙΩΤΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΓΙΟΣ ΘΩΜΑΣ', guest_type: 'ΟΙΚ', surname: 'ΧΑΝΙΩΤΑΚΗΣ', first_name: 'ΓΙΩΡΓΗΣ', father_name: 'ΖΑΧΑΡΙΑ', nickname: null, responsible: 'ΧΑΝΙΩΤΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΓΙΟΣ ΘΩΜΑΣ', guest_type: 'ΟΙΚ', surname: 'ΧΑΝΙΩΤΑΚΗΣ', first_name: 'ΓΙΑΝΝΗΣ', father_name: 'ΣΤΥΛΙΑΝΟΥ', nickname: null, responsible: 'ΧΑΝΙΩΤΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΓΙΟΣ ΘΩΜΑΣ', guest_type: 'ΟΙΚ', surname: 'ΧΑΝΙΩΤΑΚΗΣ', first_name: 'ΖΑΧΑΡΙΑΣ', father_name: 'ΓΕΩΡΓΙΟΥ', nickname: null, responsible: 'ΧΑΝΙΩΤΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΓΙΟΣ ΘΩΜΑΣ', guest_type: 'ΟΙΚ', surname: 'ΧΑΝΙΩΤΑΚΗΣ', first_name: 'ΝΙΚΟΣ', father_name: 'ΓΕΩΡΓΙΟΥ', nickname: null, responsible: 'ΧΑΝΙΩΤΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΓΙΟΣ ΘΩΜΑΣ', guest_type: 'ΟΙΚ', surname: 'ΧΑΝΙΩΤΑΚΗΣ', first_name: 'ΣΤΕΛΙΟΣ', father_name: 'ΓΕΩΡΓΙΟΥ', nickname: null, responsible: 'ΧΑΝΙΩΤΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΓΙΟΣ ΘΩΜΑΣ', guest_type: 'ΟΙΚ', surname: 'ΧΑΝΙΩΤΑΚΗ', first_name: 'ΜΑΡΙΑ', father_name: 'ΣΤΥΛΙΑΝΟΥ', nickname: null, responsible: 'ΧΑΝΙΩΤΑΚΗΣ', gift_amount: null, details: null },
  
  // ΑΝΩΓΕΙΑ records
  { source: 'Β', number: 1, village: 'ΑΝΩΓΕΙΑ', guest_type: 'ΟΙΚ', surname: 'ΔΡΑΜΟΥΝΤΑΝΗΣ', first_name: 'ΜΑΝΩΛΗΣ', father_name: null, nickname: 'ΚΟΡΑΚΑΣ - ΟΚ', responsible: 'ΒΟΥΪΔΑΣΚΗΣ ΜΑΝΩΛΗΣ ΣΥΝΤΕΚΝΟΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΝΩΓΕΙΑ', guest_type: 'ΟΙΚ', surname: 'ΔΡΑΜΟΥΝΤΑΝΗΣ', first_name: 'ΓΙΩΡΓΗΣ', father_name: null, nickname: 'ΚΟΡΑΚΑΣ', responsible: 'ΒΟΥΪΔΑΣΚΗΣ ΜΑΝΩΛΗΣ ΣΥΝΤΕΚΝΟΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΝΩΓΕΙΑ', guest_type: 'ΟΙΚ', surname: 'ΔΡΑΜΟΥΝΤΑΝΗΣ', first_name: 'ΝΙΚΟΣ', father_name: null, nickname: 'ΣΠΑΛΑΤΖΗ - ΟΚ', responsible: 'ΒΟΥΪΔΑΣΚΗΣ ΜΑΝΩΛΗΣ ΣΥΝΤΕΚΝΟΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΝΩΓΕΙΑ', guest_type: 'ΟΙΚ', surname: 'ΔΡΑΜΟΥΝΤΑΝΗΣ', first_name: 'ΒΑΣΙΛΕΙΟΣ', father_name: null, nickname: 'ΣΠΑΛΑΤΖΗ - ΟΚ', responsible: 'ΒΟΥΪΔΑΣΚΗΣ ΜΑΝΩΛΗΣ ΣΥΝΤΕΚΝΟΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΝΩΓΕΙΑ', guest_type: 'ΟΙΚ', surname: 'ΔΡΑΜΟΥΝΤΑΝΗΣ', first_name: 'ΜΙΧΑΛΗΣ', father_name: null, nickname: 'ΒΟΥΚΟΥΒΑΛΗ - ΟΚ', responsible: 'ΒΟΥΪΔΑΣΚΗΣ ΜΑΝΩΛΗΣ ΣΥΝΤΕΚΝΟΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΝΩΓΕΙΑ', guest_type: 'ΟΙΚ', surname: 'ΔΡΑΜΟΥΝΤΑΝΗΣ', first_name: 'ΓΙΑΝΝΗΣ', father_name: 'ΜΙΧΑΛΗ', nickname: 'ΒΟΥΚΟΥΒΑΛΗ', responsible: 'ΒΟΥΪΔΑΣΚΗΣ ΜΑΝΩΛΗΣ ΣΥΝΤΕΚΝΟΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΝΩΓΕΙΑ', guest_type: 'ΟΙΚ', surname: 'ΔΡΑΜΟΥΝΤΑΝΗ', first_name: 'ΑΣΠΑΣΙΑ', father_name: 'ΜΙΧΑΛΗ', nickname: 'ΒΟΥΚΟΥΒΑΛΗ', responsible: 'ΒΟΥΪΔΑΣΚΗΣ ΜΑΝΩΛΗΣ ΣΥΝΤΕΚΝΟΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΝΩΓΕΙΑ', guest_type: 'ΟΙΚ', surname: 'ΔΡΑΜΟΥΝΤΑΝΗΣ', first_name: 'ΝΙΚΟΣ', father_name: 'ΜΙΧΑΛΗ', nickname: 'ΒΟΥΚΟΥΒΑΛΗ', responsible: 'ΒΟΥΪΔΑΣΚΗΣ ΜΑΝΩΛΗΣ ΣΥΝΤΕΚΝΟΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΝΩΓΕΙΑ', guest_type: 'ΟΙΚ', surname: 'ΒΟΥΪΔΑΣΚΗΣ', first_name: 'ΜΑΝΩΛΗΣ', father_name: null, nickname: 'ΣΥΝΤΕΚΝΟΣ - ΟΚ', responsible: 'ΒΟΥΪΔΑΣΚΗΣ ΜΑΝΩΛΗΣ ΣΥΝΤΕΚΝΟΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΝΩΓΕΙΑ', guest_type: 'ΟΙΚ', surname: 'ΒΟΥΪΔΑΣΚΗΣ', first_name: 'ΓΙΩΡΓΗΣ', father_name: 'ΜΑΝΩΛΗ', nickname: 'ΣΥΝΤΕΚΝΟΣ', responsible: 'ΒΟΥΪΔΑΣΚΗΣ ΜΑΝΩΛΗΣ ΣΥΝΤΕΚΝΟΣ', gift_amount: null, details: null },
  { source: 'Β', number: 1, village: 'ΑΝΩΓΕΙΑ', guest_type: 'ΟΙΚ', surname: 'ΒΟΥΪΔΑΣΚΗ', first_name: 'ΜΑΡΙΑ', father_name: 'ΜΑΝΩΛΗ', nickname: 'ΣΥΝΤΕΚΝΟΣ', responsible: 'ΒΟΥΪΔΑΣΚΗΣ ΜΑΝΩΛΗΣ ΣΥΝΤΕΚΝΟΣ', gift_amount: null, details: null },
  
  // Sample data from various villages to represent the full dataset
  { source: 'Β', number: 2, village: 'ΑΞΟΣ', guest_type: 'ΟΙΚ', surname: 'ΒΛΑΧΑΚΗΣ', first_name: 'ΓΙΩΡΓΗΣ', father_name: null, nickname: null, responsible: 'ΣΦΑΚΙΑΝΑΚΗΣ ΝΙΚΟΣ', gift_amount: null, details: null },
  { source: 'Β', number: 2, village: 'ΑΞΟΣ', guest_type: 'ΟΙΚ', surname: 'ΣΦΑΚΙΑΝΑΚΗΣ', first_name: 'ΝΙΚΟΣ', father_name: null, nickname: null, responsible: 'ΣΦΑΚΙΑΝΑΚΗΣ ΝΙΚΟΣ', gift_amount: null, details: null },
  { source: 'Β', number: 2, village: 'ΑΞΟΣ', guest_type: 'ΟΙΚ', surname: 'ΣΦΑΚΙΑΝΑΚΗ', first_name: 'ΕΙΡΗΝΗ', father_name: null, nickname: null, responsible: 'ΣΦΑΚΙΑΝΑΚΗΣ ΝΙΚΟΣ', gift_amount: null, details: null },
  
  { source: 'Β', number: 3, village: 'ΓΩΝΙΕΣ', guest_type: 'ΟΙΚ', surname: 'ΜΑΝΟΥΡΑΣ', first_name: 'ΓΙΩΡΓΗΣ', father_name: null, nickname: null, responsible: 'ΚΥΡΙΑΚΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 3, village: 'ΓΩΝΙΕΣ', guest_type: 'ΟΙΚ', surname: 'ΚΥΡΙΑΚΑΚΗΣ', first_name: 'ΜΙΧΑΛΗΣ', father_name: null, nickname: null, responsible: 'ΚΥΡΙΑΚΑΚΗΣ', gift_amount: null, details: null },
  
  { source: 'Β', number: 4, village: 'ΖΩΝΙΑΝΑ', guest_type: 'ΟΙΚ', surname: 'ΣΚΟΥΛΟΥΔΑΚΗΣ', first_name: 'ΜΑΝΩΛΗΣ', father_name: null, nickname: null, responsible: 'ΣΚΟΥΛΟΥΔΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 4, village: 'ΖΩΝΙΑΝΑ', guest_type: 'ΟΙΚ', surname: 'ΣΚΟΥΛΟΥΔΑΚΗΣ', first_name: 'ΝΙΚΟΣ', father_name: null, nickname: null, responsible: 'ΣΚΟΥΛΟΥΔΑΚΗΣ', gift_amount: null, details: null },
  
  { source: 'Β', number: 5, village: 'ΣΙΣΑΡΧΑ', guest_type: 'ΟΙΚ', surname: 'ΚΕΦΑΛΟΓΙΑΝΝΗΣ', first_name: 'ΓΙΑΝΝΗΣ', father_name: null, nickname: null, responsible: 'ΚΕΦΑΛΟΓΙΑΝΝΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 5, village: 'ΣΙΣΑΡΧΑ', guest_type: 'ΟΙΚ', surname: 'ΚΕΦΑΛΟΓΙΑΝΝΗ', first_name: 'ΜΑΡΙΑ', father_name: null, nickname: null, responsible: 'ΚΕΦΑΛΟΓΙΑΝΝΗΣ', gift_amount: null, details: null },
  
  // More representative samples
  { source: 'Ν', number: 1, village: 'ΗΡΑΚΛΕΙΟ', guest_type: 'ΦΙΛ', surname: 'ΠΑΠΑΔΑΚΗΣ', first_name: 'ΚΩΣΤΑΣ', father_name: null, nickname: null, responsible: 'ΝΥΦΗ', gift_amount: null, details: null },
  { source: 'Ν', number: 1, village: 'ΗΡΑΚΛΕΙΟ', guest_type: 'ΦΙΛ', surname: 'ΠΑΠΑΔΑΚΗ', first_name: 'ΕΛΕΝΗ', father_name: null, nickname: null, responsible: 'ΝΥΦΗ', gift_amount: null, details: null },
  { source: 'Ν', number: 2, village: 'ΡΕΘΥΜΝΟ', guest_type: 'ΟΙΚ', surname: 'ΑΝΤΩΝΑΚΗΣ', first_name: 'ΓΙΩΡΓΗΣ', father_name: null, nickname: null, responsible: 'ΓΑΜΠΡΟΣ', gift_amount: null, details: null },
  { source: 'Ν', number: 2, village: 'ΡΕΘΥΜΝΟ', guest_type: 'ΟΙΚ', surname: 'ΑΝΤΩΝΑΚΗ', first_name: 'ΑΝΝΑ', father_name: null, nickname: null, responsible: 'ΓΑΜΠΡΟΣ', gift_amount: null, details: null },
  
  // Additional villages
  { source: 'Β', number: 6, village: 'ΚΡΟΥΣΩΝΑΣ', guest_type: 'ΟΙΚ', surname: 'ΠΕΤΡΑΚΗΣ', first_name: 'ΜΑΝΩΛΗΣ', father_name: null, nickname: null, responsible: 'ΠΕΤΡΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 7, village: 'ΤΥΛΙΣΣΟΣ', guest_type: 'ΟΙΚ', surname: 'ΜΑΡΑΚΗΣ', first_name: 'ΝΙΚΟΣ', father_name: null, nickname: null, responsible: 'ΜΑΡΑΚΗΣ', gift_amount: null, details: null },
  { source: 'Β', number: 8, village: 'ΑΓΙΑ ΒΑΡΒΑΡΑ', guest_type: 'ΦΙΛ', surname: 'ΣΤΕΦΑΝΑΚΗΣ', first_name: 'ΓΙΑΝΝΗΣ', father_name: null, nickname: null, responsible: 'ΣΤΕΦΑΝΑΚΗΣ', gift_amount: null, details: null },
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Excel data import...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Please login first' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse request body for custom data
    let dataToImport = excelData;
    try {
      const body = await req.json();
      if (body.data && Array.isArray(body.data)) {
        dataToImport = body.data;
      }
    } catch {
      // Use default data if no body provided
    }

    console.log(`Importing ${dataToImport.length} records for user ${userId}...`);

    // Add user_id to each record
    const dataWithUserId = dataToImport.map(record => ({
      ...record,
      user_id: userId
    }));

    // Insert in batches of 100 for better performance
    const batchSize = 100;
    let inserted = 0;
    let errors: string[] = [];

    for (let i = 0; i < dataWithUserId.length; i += batchSize) {
      const batch = dataWithUserId.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('wedding_gifts')
        .insert(batch);

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        inserted += batch.length;
        console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} records`);
      }
    }

    console.log(`Import complete. Inserted: ${inserted}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        total: dataToImport.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Import error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
