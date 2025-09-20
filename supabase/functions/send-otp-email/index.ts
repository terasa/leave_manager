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

    // محتوای ایمیل با طراحی حرفه‌ای
    const emailContent = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; text-align: center; color: white; margin-bottom: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: #667eea; font-size: 24px; font-weight: bold;">🔐</span>
            </div>
          </div>
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">سیستم مدیریت مرخصی حسا</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">کد ورود یکبار مصرف</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; margin-bottom: 25px; box-shadow: 0 5px 20px rgba(0,0,0,0.08);">
          <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 24px; font-weight: 600;">سلام ${name} عزیز</h2>
          <p style="color: #4a5568; margin-bottom: 30px; font-size: 16px; line-height: 1.6;">برای ورود به حساب کاربری خود، از کد زیر استفاده کنید:</p>
          
          <!-- OTP Code Box -->
          <div style="background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); border: 3px dashed #2196f3; padding: 25px; border-radius: 12px; margin: 30px 0; position: relative;">
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <span style="font-size: 36px; font-weight: bold; color: #1976d2; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</span>
            </div>
          </div>
          
          <!-- Expiry Warning -->
          <div style="background: #fff3e0; border: 1px solid #ffb74d; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #e65100; font-weight: 600; font-size: 14px;">
              ⏰ این کد تا <strong>${expiryTime.toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}</strong> معتبر است
            </p>
          </div>
        </div>
        
        <!-- Security Notice -->
        <div style="background: #ffebee; border: 1px solid #ef5350; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 20px; margin-left: 10px;">🛡️</span>
            <h3 style="margin: 0; color: #c62828; font-size: 16px; font-weight: 600;">نکات امنیتی مهم</h3>
          </div>
          <ul style="margin: 10px 0; padding-right: 20px; color: #d32f2f; font-size: 14px; line-height: 1.6;">
            <li>این کد را با هیچ‌کس به اشتراک نگذارید</li>
            <li>تیم پشتیبانی هرگز از شما کد یکبار مصرف نخواهد پرسید</li>
            <li>در صورت دریافت ایمیل مشکوک، با ما تماس بگیرید</li>
          </ul>
        </div>
        
        <!-- Instructions -->
        <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 3px 15px rgba(0,0,0,0.05);">
          <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 18px; font-weight: 600;">نحوه استفاده:</h3>
          <ol style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-right: 20px;">
            <li>به صفحه ورود بازگردید</li>
            <li>گزینه "ورود با کد یکبار مصرف" را انتخاب کنید</li>
            <li>کد ۶ رقمی بالا را وارد کنید</li>
            <li>روی دکمه "ورود" کلیک کنید</li>
          </ol>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; color: #718096; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <div style="margin-bottom: 10px;">
            <strong style="color: #2d3748;">سیستم مدیریت مرخصی حسا</strong>
          </div>
          <div style="margin-bottom: 5px;">📧 ehsantaj@yahoo.com</div>
          <div style="margin-bottom: 15px;">🌐 leave.finet.pro</div>
          <p style="margin: 0; font-size: 11px; color: #a0aec0;">
            این ایمیل به صورت خودکار ارسال شده است. لطفاً به آن پاسخ ندهید.
          </p>
        </div>
      </div>
    `

    // ارسال ایمیل با استفاده از Resend API
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found')
      // برای تست، کد را برمی‌گردانیم
      return new Response(
        JSON.stringify({
          success: true,
          code: otpCode, // فقط برای تست - در تولید حذف شود
          message: 'کد یکبار مصرف تولید شد (تست)',
          expiresAt: expiryTime.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ارسال ایمیل واقعی
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'سیستم مدیریت مرخصی حسا <noreply@leave.finet.pro>',
        to: [email],
        subject: `کد ورود یکبار مصرف: ${otpCode}`,
        html: emailContent,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Email sending failed:', errorData)
      
      // در صورت خطا، کد را برای تست برمی‌گردانیم
      return new Response(
        JSON.stringify({
          success: true,
          code: otpCode, // فقط برای تست
          message: 'خطا در ارسال ایمیل - کد تست ارائه شد',
          expiresAt: expiryTime.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult)

    // پاسخ موفق
    return new Response(
      JSON.stringify({
        success: true,
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