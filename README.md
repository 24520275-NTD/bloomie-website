This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Email xác nhận đơn hàng

Khi Bloomie ghi nhận đơn mới, Supabase lưu một yêu cầu gửi email trong cùng giao dịch. Lịch gửi xử lý các đơn mới mỗi phút, gồm COD, ví giả lập và QR VNPay minh họa. Bloomie gửi email xác nhận khi đặt đơn và một email riêng khi đơn chuyển sang Hoàn tất (COD, QR VNPay minh họa hoặc ví giả lập).

### Cấu hình lần đầu

1. Chọn Gmail SMTP hoặc Resend. Với Gmail, đăng nhập Gmail riêng của Bloomie, bật Xác minh 2 bước và tạo mật khẩu ứng dụng tại https://myaccount.google.com/apppasswords. Với Resend, xác minh tên miền gửi và tạo API key có quyền gửi email.
2. Thêm các biến môi trường sau vào dự án Bloomie trên Vercel, rồi triển khai bản có mã gửi email.

| Biến | Giá trị |
| --- | --- |
| `BLOOMIE_ORDER_EMAIL_PROVIDER` | `gmail` để dùng Gmail, hoặc `resend` để dùng Resend (mặc định) |
| `BLOOMIE_GMAIL_USER` | Địa chỉ Gmail đầy đủ của Bloomie, khi dùng Gmail |
| `BLOOMIE_GMAIL_APP_PASSWORD` | Mật khẩu ứng dụng do Google cấp, khi dùng Gmail |
| `RESEND_API_KEY` | API key của Resend, khi dùng Resend |
| `BLOOMIE_ORDER_EMAIL_FROM` | Địa chỉ gửi Resend, ví dụ `Bloomie <donhang@ten-mien-da-xac-minh.vn>` |
| `BLOOMIE_SITE_URL` | URL HTTPS của website Bloomie đã triển khai |
| `BLOOMIE_ORDER_EMAIL_JOB_SECRET` | Chuỗi ngẫu nhiên riêng để Supabase gọi lịch gửi email |
| `SUPABASE_SERVICE_ROLE_KEY` | Khóa Supabase server của cùng dự án, dùng lại nếu đã có |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase của website, dùng lại nếu đã có |

3. Áp dụng lần lượt hai migration `supabase/migrations/20261128160000_order_confirmation_emails.sql` và `supabase/migrations/20261128161000_order_completion_emails.sql` vào Supabase. Nếu migration đầu đã chạy thành công, chỉ áp dụng migration thứ hai.
4. Trong Supabase Vault, tạo hai secret. Đặt `bloomie_order_email_job_url` thành URL HTTPS đầy đủ của route `/api/internal/order-confirmation-emails` trên website. Đặt `bloomie_order_email_job_secret` thành giá trị của `BLOOMIE_ORDER_EMAIL_JOB_SECRET` bên Vercel.
5. Chạy đoạn sau trong Supabase SQL Editor để bật lịch. Nếu gọi qua URL triển khai Vercel, URL phải truy cập được từ Supabase.

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'bloomie-order-confirmation-emails',
  '* * * * *',
  $cron$
    select net.http_post(
      url := config.endpoint,
      headers := jsonb_build_object('Authorization', 'Bearer ' || config.secret, 'Content-Type', 'application/json'),
      timeout_milliseconds := 55000
    )
    from (
      select
        (select decrypted_secret from vault.decrypted_secrets
         where name = 'bloomie_order_email_job_url') as endpoint,
        (select decrypted_secret from vault.decrypted_secrets
         where name = 'bloomie_order_email_job_secret') as secret
    ) as config
    where config.endpoint is not null
      and config.secret is not null
      and exists (
        select 1
        from bloomie_private.order_confirmation_emails as job
        where job.sent_at is null
          and job.next_attempt_at <= now()
          and (job.first_attempt_at is null or job.first_attempt_at > now() - interval '23 hours')
      );
  $cron$
);
```

6. Dùng tài khoản Bloomie có email đã xác thực để đặt một đơn thử. Mở chi tiết đơn COD mới và bấm **Hoàn tất đơn hàng**. Đối chiếu mã đơn, tổng tiền và giờ hoàn tất với email có tiêu đề **[Bloomie] Đã hoàn tất đơn hàng**. Với Gmail, mục **Đã gửi** của tài khoản Bloomie hiển thị thư đã chuyển đi. Với Resend, xem trạng thái trong mục **Emails**.

Hệ thống ghi nhận trạng thái theo từng đơn và lùi thời gian thử lại khi gặp lỗi, trong vòng 23 giờ kể từ lần gửi đầu tiên. Với Resend, khóa chống gửi trùng bảo vệ cả lần thử lại. Với Gmail SMTP, nếu máy chủ đã nhận thư nhưng trạng thái chưa kịp lưu, lần thử lại có thể tạo thêm một thư. Để kiểm tra một đơn từ SQL Editor, chạy truy vấn sau với UUID đầy đủ của đơn.

```sql
select order_id, email_event, attempts, next_attempt_at, first_attempt_at, sent_at, provider_email_id
from bloomie_private.order_confirmation_emails
where order_id = '00000000-0000-0000-0000-000000000000';
```
