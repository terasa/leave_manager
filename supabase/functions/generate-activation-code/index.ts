import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GenerateCodeRequest {
  licenseType: 'admin' | 'trial';
  purchaseInfo?: any;
  adminKey?: string; // کلید امنیتی برای تولید کد
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { licenseType, purchaseInfo, adminKey }: GenerateCodeRequest = await req.json()

    // بررسی کلید امنیتی (برای جلوگیری از تولید کد غیرمجاز)
    const expectedAdminKey = Deno.env.get('ADMIN_SECRET_KEY') || 'your-secret-admin-key'
    if (adminKey !== expectedAdminKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'دسترسی غیرمجاز' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    if (!licenseType || !['admin', 'trial'].includes(licenseType)) {
      return new Response(
        JSON.stringify({ success: false, message: 'نوع مجوز نامعتبر است' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // تولید کد منحصر به فرد
    const generateUniqueCode = (): string => {
      const prefix = licenseType === 'admin' ? 'HESA-ADMIN' : 'HESA-TRIAL'
      const year = new Date().getFullYear()
      const randomPart = Math.random().toString(36).substr(2, 3).toUpperCase()
      const timestamp = Date.now().toString().slice(-3)
      return `${prefix}-${year}-${randomPart}${timestamp}`
    }

    let code = generateUniqueCode()
    let attempts = 0
    const maxAttempts = 10

    // اطمینان از منحصر به فرد بودن کد
    while (attempts < maxAttempts) {
      const { data: existingCode } = await supabase
        .from('activation_codes')
        .select('id')
        .eq('code', code)
        .single()

      if (!existingCode) break

      code = generateUniqueCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return new Response(
        JSON.stringify({ success: false, message: 'خطا در تولید کد منحصر به فرد' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // تعیین تاریخ انقضا
    let expiresAt = null
    if (licenseType === 'trial') {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 1) // 1 روز
      expiresAt = expiry.toISOString()
    }

    // ذخیره کد در پایگاه داده
    const { data: newCode, error: insertError } = await supabase
      .from('activation_codes')
      .insert({
        code,
        license_type: licenseType,
        expires_at: expiresAt,
        purchase_info: purchaseInfo || {}
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ success: false, message: 'خطا در ذخیره کد' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // پاسخ موفق
    return new Response(
      JSON.stringify({
        success: true,
        code: newCode.code,
        licenseType: newCode.license_type,
        expiresAt: newCode.expires_at,
        message: 'کد فعال‌سازی با موفقیت تولید شد'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Generation error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'خطای سرور' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})