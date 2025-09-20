import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ActivationRequest {
  code: string;
  deviceFingerprint: string;
  userAgent?: string;
  ipAddress?: string;
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

    const { code, deviceFingerprint, userAgent, ipAddress }: ActivationRequest = await req.json()

    if (!code || !deviceFingerprint) {
      return new Response(
        JSON.stringify({ success: false, message: 'کد فعال‌سازی و شناسه دستگاه الزامی است' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // بررسی وجود کد در پایگاه داده
    const { data: activationCode, error: codeError } = await supabase
      .from('activation_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (codeError || !activationCode) {
      return new Response(
        JSON.stringify({ success: false, message: 'کد فعال‌سازی نامعتبر است' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // بررسی فعال بودن کد
    if (!activationCode.is_active) {
      return new Response(
        JSON.stringify({ success: false, message: 'کد فعال‌سازی غیرفعال شده است' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // بررسی انقضا
    if (activationCode.expires_at && new Date(activationCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, message: 'کد فعال‌سازی منقضی شده است' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // بررسی استفاده قبلی روی دستگاه دیگر
    if (activationCode.is_used && activationCode.used_by !== deviceFingerprint) {
      return new Response(
        JSON.stringify({ success: false, message: 'این کد قبلاً روی دستگاه دیگری استفاده شده است' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ثبت یا بروزرسانی فعال‌سازی
    const { error: activationError } = await supabase
      .from('license_activations')
      .upsert({
        activation_code: code.toUpperCase(),
        device_fingerprint: deviceFingerprint,
        user_agent: userAgent,
        ip_address: ipAddress,
        last_check: new Date().toISOString(),
        is_active: true
      })

    if (activationError) {
      console.error('Activation error:', activationError)
      return new Response(
        JSON.stringify({ success: false, message: 'خطا در ثبت فعال‌سازی' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // بروزرسانی وضعیت کد
    if (!activationCode.is_used) {
      await supabase
        .from('activation_codes')
        .update({
          is_used: true,
          used_by: deviceFingerprint,
          used_at: new Date().toISOString()
        })
        .eq('id', activationCode.id)
    }

    // پاسخ موفق
    return new Response(
      JSON.stringify({
        success: true,
        message: 'نرم‌افزار با موفقیت فعال شد',
        licenseType: activationCode.license_type,
        expiresAt: activationCode.expires_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Validation error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'خطای سرور' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})