# Cài đặt Webmail của lehuunghi

Mã nguồn: https://github.com/lehuunghi/webmail. Giao diện mới mặc định là tiếng Việt; lựa chọn ngôn ngữ đã lưu của người dùng vẫn được giữ. Có thể đổi tên bằng `APP_NAME`. Đây là **ứng dụng đọc thư JMAP**, cần máy chủ **Stalwart 0.16 trở lên** đang hoạt động. Nó không tự cung cấp SMTP, IMAP hay tạo hộp thư. Tạo tài khoản, tên miền và DNS gửi/nhận thư trên Stalwart trước.

## 1. Chuẩn bị chung

- Tên miền giao diện, ví dụ `webmail.example.com`, trỏ đến máy chạy ứng dụng.
- Địa chỉ Stalwart, ví dụ `https://mail.example.com`, có chứng chỉ TLS hợp lệ. Từ máy chạy Webmail phải truy cập được `https://mail.example.com/.well-known/jmap`.
- HTTPS cho giao diện (AutoSSL cPanel hoặc reverse proxy Caddy/Nginx). Khi đặt `TRUST_PROXY=1`, cookie đăng nhập yêu cầu HTTPS.
- Tạo bí mật riêng bằng `openssl rand -base64 48`. Giữ nguyên bí mật khi cập nhật; không đưa `.env` vào Git.
- Máy build cần Node.js **22.12 trở lên hoặc 24 LTS** và npm. Chỉ thỏa `>=20.19` trong package.json chưa đủ cho các công cụ build hiện tại. Dockerfile sử dụng Node 26.
- Nếu dùng đường dẫn `/mail` thay vì tên miền riêng: đặt `BASE_PATH=/mail` **cả lúc build và lúc chạy**, reverse proxy giữ nguyên tiền tố. Các ví dụ dưới đây dùng tên miền riêng ở đường dẫn `/`.

## 2. Docker riêng: build từ repo của bạn

Trên VPS Linux đã cài Docker Engine và Compose plugin:

```sh
git clone https://github.com/lehuunghi/webmail.git
cd webmail
cp .env.example .env
openssl rand -base64 48
```

Sửa `.env`, tối thiểu:

```dotenv
STALWART_URL=https://mail.example.com
APP_SECRET=THAY_BANG_BI_MAT_VUA_TAO
APP_NAME=Webmail
SOURCE_URL=https://github.com/lehuunghi/webmail
TRUST_PROXY=1
```

Build và khởi động bản riêng (không tải image của dự án gốc):

```sh
docker compose build --pull
docker compose up -d
docker compose ps
docker compose logs --tail=100 webmail
curl http://127.0.0.1:8080/api/health
```

Image được tạo có tên `lehuunghi/webmail:local`. `/data` được lưu trong volume `webmail-data` (Compose có thể thêm tiền tố tên dự án). Đừng xóa volume khi cập nhật. Nếu chạy nhiều bản, mỗi bản dùng volume và bí mật riêng.

### HTTPS bằng Caddy trên cùng VPS

Trỏ DNS trước, mở cổng 80/443. Với Caddy cài trực tiếp trên host, thêm:

```caddyfile
webmail.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

Reload Caddy rồi mở `https://webmail.example.com`. Cổng 8080 chỉ bind loopback. Nếu proxy cũng chạy Docker, kết nối hai container vào cùng mạng và proxy tới `webmail:8080`; `127.0.0.1` trong container proxy là chính container đó. Không cần công khai cổng 8080. Nginx cần chuyển `Host`, `X-Forwarded-Proto`, `X-Forwarded-For`; tắt buffering cho kết nối sự kiện nếu cập nhật thư bị chậm.

### Cập nhật và quay lui

```sh
docker tag lehuunghi/webmail:local lehuunghi/webmail:previous
git pull --ff-only
docker compose build --pull
docker compose up -d
```

Kiểm tra health và đăng nhập. Nếu cần quay lui: `docker tag lehuunghi/webmail:previous lehuunghi/webmail:local`, rồi `docker compose up -d --force-recreate --no-build`. Giữ `.env`, APP_SECRET và volume. Trước thay đổi lớn, sao lưu volume khi ứng dụng đã dừng; dữ liệu thư thật nằm trên Stalwart, cần sao lưu riêng.

## 3. Portainer (Docker Standalone)

Hướng dẫn này dùng môi trường **Docker Standalone**, không phải Swarm. Image phải tồn tại trên **đúng Docker host mà Portainer quản lý**.

1. SSH vào Docker host đó; clone repo và chạy `docker build --pull -t lehuunghi/webmail:local .` từ thư mục repo. Nếu build trên máy khác, chuyển image bằng `docker save` / `docker load`, hoặc push lên registry của bạn. Tag `:local` không phải image đã được xuất bản sẵn trên Docker Hub.
2. Trong Portainer chọn Environment đúng → **Stacks → Add stack**. Đặt tên `webmail`.
3. Chọn **Web editor**, dán nội dung `docker-compose.portainer.yml` của repo. File này dùng image đã build nên không cần build context trong Web editor.
4. Trong **Environment variables**, thêm `STALWART_URL` và `APP_SECRET`; nếu dùng registry/tag khác thêm `WEBMAIL_IMAGE`. Không bật buộc pull image khi đang dùng image local.
5. Chọn **Deploy the stack**. Mở Containers → container webmail → Logs và kiểm tra trạng thái health. Nếu cổng 8080 đã dùng, thay phần host trong mapping thành `127.0.0.1:8081:8080` và sửa proxy tương ứng.
6. Cấu hình HTTPS như phần Docker. Với Nginx Proxy Manager chạy Docker, dùng mạng chung (thêm external network vào stack), hostname upstream là tên service/container trên mạng đó, cổng 8080. Đừng dùng loopback của host làm upstream từ container.
7. Khi cập nhật, build lại trên host đúng hoặc push tag phiên bản mới. Đổi `WEBMAIL_IMAGE` sang tag mới trong stack rồi redeploy. Với image local giữ cùng tag, recreate container sau build; không chọn pull từ registry. Giữ volume và APP_SECRET.

Có thể dùng Repository thay cho Web editor với `docker-compose.yml` nếu môi trường Portainer hỗ trợ build từ Git. Cách image đã build ở trên dễ kiểm tra hơn và không phụ thuộc hỗ trợ build của Portainer.

## 4. Node.js trên hosting cPanel

Hosting phải hỗ trợ Node.js/Passenger (Application Manager hoặc CloudLinux **Setup Node.js App**), SSH/Terminal, biến môi trường, kết nối HTTPS ra Stalwart và tiến trình Node lâu dài. Hosting PHP thông thường không chạy được ứng dụng này. Hỏi nhà cung cấp về Node 22.12+/24 LTS và SSE/WebSocket nếu sự kiện cập nhật bị chặn. Không cài Docker vào shared hosting.

### 4.1 Tải và build

Dùng thư mục ngoài `public_html`, ví dụ `/home/CPANEL_USER/webmail`:

```sh
cd ~
git clone https://github.com/lehuunghi/webmail.git
cd webmail
node --version
npm ci
npm run build
mkdir -p data tmp
chmod 700 data
openssl rand -base64 48
```

Nếu hosting không đủ RAM hoặc thiếu Node phù hợp để build, build trên máy Linux khác rồi tải lên `web/dist`, `server/dist`, `scripts`, `app.cjs`, các package.json và package-lock.json; sau đó chạy `npm ci --omit=dev --workspace server` trên hosting. Không tải node_modules của Windows lên Linux.

### 4.2 Tạo ứng dụng

1. Tạo subdomain `webmail.example.com`, bật AutoSSL và buộc HTTPS.
2. Trong **Setup Node.js App**, chọn Node phù hợp, mode Production, application root `webmail`, URL subdomain, startup file **app.cjs**. Repo cung cấp file này để Passenger nạp được CommonJS và khởi động server ESM đã build.
3. Nếu dùng **Application Manager** của cPanel chuẩn: đăng ký application path `/home/CPANEL_USER/webmail`; nhờ nhà cung cấp cấu hình `PassengerStartupFile app.cjs` trong cấu hình Passenger theo tài liệu cPanel. Giao diện này có thể không có ô startup file. Không sửa tên server/dist/index.js tùy ý.
4. Thêm các biến sau trong giao diện quản lý ứng dụng; thay CPANEL_USER và địa chỉ Stalwart:

```dotenv
NODE_ENV=production
STALWART_URL=https://mail.example.com
APP_SECRET=BI_MAT_NGAU_NHIEN_CUA_BAN
APP_NAME=Webmail
SOURCE_URL=https://github.com/lehuunghi/webmail
STATIC_DIR=/home/CPANEL_USER/webmail/web/dist
SESSION_FILE=/home/CPANEL_USER/webmail/data/sessions.json
TRUST_PROXY=1
IMAGE_PROXY=1
```

Ứng dụng không tự nạp `.env` khi chạy `node` thông thường. Nhập biến vào cPanel là bước bắt buộc. Để Passenger quản lý socket/cổng, không ép PORT nếu nhà cung cấp không yêu cầu. APP_SECRET phải đủ mạnh; server sẽ từ chối khởi động production khi thiếu.

5. Start/Restart app. Nếu có môi trường ảo CloudLinux, chạy lệnh kích hoạt môi trường mà cPanel hiển thị trước khi chạy npm.
6. Mở `https://webmail.example.com/api/health`, rồi đăng nhập bằng tài khoản Stalwart. Trang đăng nhập phải có “Tiếng Việt”, “Đăng nhập” và liên kết hướng dẫn. Thử gửi/nhận một thư bằng tài khoản thật.

### 4.3 Cập nhật cPanel

Sao lưu mã nguồn phiên bản cũ, `data` và ghi lại các biến. Chạy `git pull --ff-only`, `npm ci`, `npm run build`, sau đó Restart trong cPanel. Với Passenger có thể chạy `mkdir -p tmp && touch tmp/restart.txt`. Kiểm tra health, đăng nhập, tài liệu và log lỗi. Không đưa APP_SECRET vào thư mục web công khai.

## 5. Kiểm tra và xử lý lỗi

| Hiện tượng | Kiểm tra |
| --- | --- |
| 502/503 | Tiến trình Node, log Passenger/Portainer, startup app.cjs và thư mục dist đã build |
| Không đăng nhập | URL Stalwart, tài khoản/mật khẩu thật, TLS hợp lệ, JMAP bật, Stalwart >=0.16 |
| Đăng nhập xong lại bị thoát | HTTPS, X-Forwarded-Proto, TRUST_PROXY, APP_SECRET cố định, quyền ghi data |
| Giao diện trắng/404 assets | BASE_PATH lúc build và chạy phải trùng; tránh cache bundle cũ |
| Portainer báo pull denied | Image :local phải build/load trên đúng host; tắt pull hoặc dùng registry/tag đã push |
| Không thấy thư mới ngay | Reverse proxy buffering/timeouts và hosting hỗ trợ luồng sự kiện; thử tải lại |

Kiểm thử demo dùng `npm run mock` và STALWART_URL `http://127.0.0.1:8788`, tài khoản `demo@example.com` / mật khẩu `demo`. Chỉ dùng trong môi trường thử nghiệm, không triển khai demo công khai. Test demo không thay thế kiểm thử Stalwart và hosting thật.

## Tài liệu đối chiếu

- cPanel: https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/
- Startup file Passenger: https://support.cpanel.net/hc/en-us/articles/360057519553-How-to-create-a-custom-NodeJS-startup-file
- Portainer stacks: https://docs.portainer.io/user/docker/stacks/add
- Docker Compose: https://docs.docker.com/compose/

Giữ LICENSE và NOTICE trong bản phân phối. Liên kết “Mã nguồn AGPL-3.0” trong ứng dụng trỏ đến mã nguồn bản của bạn.
