import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface OTPRequest {
  email: string;
  name: string;
  customerId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, name, customerId }: OTPRequest = await req.json()

    if (!email || !name || !customerId) {
      return new Response(
        JSON.stringify({ success: false, message: 'اطلاعات ناقص است' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // تولید کد یکبار مصرف ۶ رقمی
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // زمان انقضا (۳۰ دقیقه)
    const expiryTime = new Date(Date.now() + 30 * 60 * 1000)

    // ارسال ایمیل (در اینجا از یک سرویس ایمیل واقعی استفاده کنید)
    // مثال: SendGrid, Resend, یا هر سرویس ایمیل دیگر
    
    const emailContent = `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">سیستم مدیریت مرخصی حسا</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">کد ورود یکبار مصرف</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333; margin-bottom: 15px;">سلام ${name} عزیز</h2>
          <p style="color: #666; margin-bottom: 20px;">کد ورود یکبار مصرف شما:</p>
          <div style="background: white; border: 2px dashed #007bff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">${otpCode}</span>
          </div>
          <p style="color: #dc3545; font-weight: bold;">این کد تا ${expiryTime.toLocaleString('fa-IR')} معتبر است</p>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>نکته امنیتی:</strong> این کد را با هیچ‌کس به اشتراک نگذارید. تیم پشتیبانی هرگز از شما کد یکبار مصرف نخواهد پرسید.
          </p>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>سیستم مدیریت مرخصی حسا</p>
          <p>ehsantaj@yahoo.com</p>
        </div>
      </div>
    `

    // در اینجا باید ایمیل واقعی ارسال شود
    // برای تست، فقط کد را برمی‌گردانیم
    console.log(`OTP Code for ${email}: ${otpCode}`)

    // پاسخ موفق
    return new Response(
      JSON.stringify({
        success: true,
        code: otpCode, // در محیط تولید این را حذف کنید
        message: 'کد یکبار مصرف به ایمیل شما ارسال شد',
        expiresAt: expiryTime.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('OTP sending error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'خطای سرور' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})