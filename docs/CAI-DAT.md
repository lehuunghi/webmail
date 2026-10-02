# Cài đặt Webmail của lehuunghi

Mã nguồn: https://github.com/lehuunghi/webmail. Giao diện mới mặc định là tiếng Việt; lựa chọn ngôn ngữ đã lưu của người dùng vẫn được giữ. Có thể đổi tên bằng `APP_NAME`. Đây là **ứng dụng đọc thư JMAP**, cần máy chủ **INBUXA hoặc Stalwart có capability registry tương thích** đang hoạt động. Nó không tự cung cấp SMTP, IMAP hay tạo hộp thư. Tạo tài khoản, tên miền và DNS gửi/nhận thư trên máy chủ thư trước.

Hướng dẫn đối chiếu với mã nguồn và tài liệu nhà cung cấp ngày **02/10/2026**. Các địa chỉ `example.com`, CPANEL_USER và chuỗi bí mật trong ví dụ phải thay bằng thông tin thật. Các bước triển khai trên dịch vụ thật chưa được chạy trong quá trình soạn tài liệu này.

> **Chọn cách cài:** có VPS/Docker → phần 2; quản lý bằng Portainer → phần 3; hosting có Node.js → phần 4; muốn dùng tên miền và HTTPS của Cloudflare mà không mở cổng vào VPS → phần 7. Cloudflare Tunnel vẫn cần máy chạy ứng dụng. Cloudflare Containers là hướng triển khai trực tiếp cần tích hợp thêm; Pages/Workers chưa chạy nguyên repo này.

### Lấy đúng bản mã nguồn

Giao diện mới và hướng dẫn cài đặt đã có trên nhánh `main`. Các lệnh clone bên dưới lấy bản chính thức này. Sao lưu cấu hình riêng trước khi cập nhật.

## 1. Chuẩn bị chung

- Tên miền giao diện, ví dụ `webmail.example.com`, trỏ đến máy chạy ứng dụng.
- Địa chỉ Stalwart, ví dụ `https://jmail.vn`, có chứng chỉ TLS hợp lệ. Từ máy chạy Webmail phải truy cập được `https://jmail.vn/.well-known/jmap`.
- HTTPS cho giao diện (AutoSSL cPanel hoặc reverse proxy Caddy/Nginx). Khi đặt `TRUST_PROXY=1`, cookie đăng nhập yêu cầu HTTPS.
- Tạo bí mật riêng bằng `openssl rand -base64 48`. Giữ nguyên bí mật khi cập nhật; không đưa `.env` vào Git.
- Máy build cần Node.js **22.12 trở lên hoặc 24 LTS** và npm. Chỉ thỏa `>=20.19` trong package.json chưa đủ cho các công cụ build hiện tại. Dockerfile sử dụng Node 26.
- Nếu dùng đường dẫn `/mail` thay vì tên miền riêng: đặt `BASE_PATH=/mail` **cả lúc build và lúc chạy**, reverse proxy giữ nguyên tiền tố. Các ví dụ dưới đây dùng tên miền riêng ở đường dẫn `/`.

### Kiểm tra trước khi cài

Chạy từ máy sẽ đặt Webmail:

```sh
curl -I https://jmail.vn/.well-known/jmap
```

Phản hồi 401 khi chưa xác thực có thể là bình thường. Lỗi DNS, timeout hoặc lỗi chứng chỉ phải xử lý trước. Không dùng `curl -k` để coi lỗi chứng chỉ là đã giải quyết. `STALWART_URL` là URL gốc, không thêm `/jmap`, `/.well-known/jmap` hoặc đường dẫn admin. Tài khoản đăng nhập phải là tài khoản đã tạo trên Stalwart.

| Biến | Cách dùng trong bản này |
| --- | --- |
| `STALWART_URL` | Mặc định `https://jmail.vn`; đổi nếu dùng máy chủ JMAP khác |
| `APP_SECRET` | Bắt buộc ở production; tạo ngẫu nhiên, giữ nguyên qua các lần cập nhật |
| `APP_NAME` | Tên hiển thị; mặc định Webmail |
| `APP_LOGO_URL` | URL trực tiếp tới ảnh hoặc đường dẫn nội bộ; để trống dùng logo mặc định |
| `TRUST_PROXY` | `1` khi nằm sau proxy HTTPS do bạn quản lý; local HTTP thử nghiệm dùng `0` |
| `SECURE_COOKIES` | Production HTTPS có thể đặt `1`; không đặt `0` để chữa lỗi đăng nhập trên production |
| `SESSION_FILE` | File lưu phiên; Dockerfile dùng `/data/sessions.json`, cPanel dùng đường dẫn ngoài public_html |
| `STATIC_DIR` | Docker đã đặt sẵn; cPanel nên đặt đường dẫn tuyệt đối tới `web/dist` |
| `BASE_PATH` | Để trống với subdomain riêng; có tiền tố thì phải truyền vào cả build và runtime |
| `MAX_UPLOAD_BYTES` | Mặc định 52428800 (50 MiB); còn chịu giới hạn Stalwart/proxy/hosting |

Compose chỉ truyền các biến được khai báo trong `environment`; thêm biến vào `.env` chưa đủ nếu YAML không tham chiếu nó. Ngược lại, server Node nạp `.env` từ thư mục làm việc hoặc thư mục dự án và ưu tiên biến môi trường đã có. Frontend build với tiền tố cần `BASE_PATH=/mail npm run build`; không chỉ sửa `.env` ở thư mục gốc rồi mặc định Vite đã nhận.

## 2. Docker riêng: build từ repo của bạn

Trên VPS Linux đã cài Docker Engine và Compose plugin:

```sh
git clone --branch main https://github.com/lehuunghi/webmail.git
cd webmail
cp .env.example .env
chmod 600 .env
openssl rand -base64 48
```

Sửa `.env`, tối thiểu:

```dotenv
STALWART_URL=https://jmail.vn
APP_SECRET=THAY_BANG_BI_MAT_VUA_TAO
APP_NAME=Webmail
APP_LOGO_URL=
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

Health phải trả JSON có `ok: true`; `docker compose ps` phải có trạng thái healthy. Health chỉ xác nhận Webmail chạy, chưa chứng minh kết nối Stalwart/gửi thư thành công. Nếu hiện lỗi quyền ghi `/data`, kiểm tra volume và user `node` của image; không dùng `chmod 777` để bỏ qua lỗi. Trước khi chạy có thể dùng `docker compose config --quiet` để kiểm tra YAML mà không in toàn bộ bí mật.

### HTTPS bằng Caddy trên cùng VPS

Trỏ DNS trước, mở cổng 80/443. Với Caddy cài trực tiếp trên host, thêm:

```caddyfile
webmail.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

Reload Caddy rồi mở `https://webmail.example.com`. Cổng 8080 chỉ bind loopback. Nếu proxy cũng chạy Docker, kết nối hai container vào cùng mạng và proxy tới `webmail:8080`; `127.0.0.1` trong container proxy là chính container đó. Không cần công khai cổng 8080. Nginx cần chuyển `Host`, `X-Forwarded-Proto`, `X-Forwarded-For`; tắt buffering cho kết nối sự kiện nếu cập nhật thư bị chậm.

Ví dụ phần location của Nginx (chứng chỉ và server_name cấu hình cho tên miền của bạn):

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_buffering off;
    proxy_read_timeout 3600s;
    client_max_body_size 60m;
}
```

Ví dụ này dành cho Nginx trực tiếp kết thúc TLS. Nếu còn một proxy phía trước, phải cấu hình lại cách tin cậy IP/protocol cho đúng chuỗi proxy. Với Docker, mặc định server tin IP loopback/private; khi topology khác, đặt `TRUSTED_PROXIES` theo IP/CIDR thực sự của proxy, không mở tin mọi địa chỉ.

### Cập nhật và quay lui

```sh
docker tag lehuunghi/webmail:local lehuunghi/webmail:previous
git pull --ff-only
docker compose build --pull
docker compose up -d
```

Kiểm tra health và đăng nhập. Nếu cần quay lui: `docker tag lehuunghi/webmail:previous lehuunghi/webmail:local`, rồi `docker compose up -d --force-recreate --no-build`. Giữ `.env`, APP_SECRET và volume. Trước thay đổi lớn, sao lưu volume khi ứng dụng đã dừng; dữ liệu thư thật nằm trên Stalwart, cần sao lưu riêng.

Chỉ chạy tag `previous` sau khi đã có image `local` cũ trên host. Khi khôi phục từ backup cần giữ cả file phiên và APP_SECRET tương ứng. Không dùng `docker compose down -v` vì lệnh đó xóa volume phiên. Dùng cùng thư mục/tên project Compose để tránh tạo một volume mới rồi tưởng phiên bị mất.

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

[Mở file YAML Portainer](https://github.com/lehuunghi/webmail/blob/main/docker-compose.portainer.yml). Trong bản HTML, nội dung hiện dưới đây để sao chép:

<!-- include:docker-compose.portainer.yml -->

### Điền biến trong Portainer

| Tên | Ví dụ |
| --- | --- |
| `STALWART_URL` | `https://jmail.vn` |
| `APP_SECRET` | Giá trị tạo bằng openssl; không dùng nguyên chuỗi minh họa |
| `WEBMAIL_IMAGE` | `lehuunghi/webmail:local` hoặc tag registry riêng đã build |
| `APP_LOGO_URL` | `https://cdn.example.com/logo.png`, hoặc bỏ trống |

Stack thông thường đang đặt `APP_NAME: Webmail` trong YAML; muốn đổi tên thì sửa dòng này hoặc đổi thành `${APP_NAME:-Webmail}` và khai báo thêm biến. Sau deploy, vào Containers chọn container webmail → Inspect/Logs để xác nhận image đúng và không có lỗi startup. Với registry riêng, cấu hình quyền pull trong Portainer trước. Với image local, kiểm tra host bằng `docker image inspect lehuunghi/webmail:local` trước deploy.

Để dùng Cloudflare Tunnel trong Portainer, thay YAML bằng `docker-compose.cloudflare.yml` và thêm `TUNNEL_TOKEN`, rồi thực hiện phần 7. Không deploy thêm một stack khác dùng cùng hostname mà không xác định rõ stack nào giữ dữ liệu phiên.

## 4. Node.js trên hosting cPanel

Hosting phải hỗ trợ Node.js/Passenger (Application Manager hoặc CloudLinux **Setup Node.js App**), SSH/Terminal, biến môi trường, kết nối HTTPS ra Stalwart và tiến trình Node lâu dài. Hosting PHP thông thường không chạy được ứng dụng này. Hỏi nhà cung cấp về Node 22.12+/24 LTS và SSE/WebSocket nếu sự kiện cập nhật bị chặn. Không cài Docker vào shared hosting.

### 4.1 Tải và build

Dùng thư mục ngoài `public_html`, ví dụ `/home/CPANEL_USER/webmail`:

```sh
cd ~
git clone --branch main https://github.com/lehuunghi/webmail.git
cd webmail
node --version
npm ci
npm run build
mkdir -p data tmp
chmod 700 data
openssl rand -base64 48
```

Nếu hosting không đủ RAM hoặc thiếu Node phù hợp để build, build trên máy Linux khác rồi tải lên `web/dist`, `server/dist`, `scripts`, `app.cjs`, các package.json và package-lock.json; sau đó chạy `npm ci --omit=dev --workspace server` trên hosting. Không tải node_modules của Windows lên Linux.

Trước khi thuê hoặc cài, hỏi nhà cung cấp: có Node 22.12+/24 LTS, chạy CommonJS startup `app.cjs`, biến môi trường riêng, tiến trình lâu dài, hỗ trợ stream HTTP và quyền kết nối HTTPS tới Stalwart không? Nếu chỉ có Node 16/18 hoặc chỉ hosting PHP, chọn VPS/Docker. Mức RAM build phụ thuộc giới hạn hosting; khi bị kill/OOM, build nơi khác thay vì lặp lại trên cùng gói.

Các đường dẫn cần có sau build: `web/dist/index.html`, `server/dist/index.js`, `scripts/version.mjs`, `scripts/basePath.mjs`, `app.cjs`. Thư mục `scripts` cần ở runtime vì server import các module này. Upload cả `server/package.json` và root package-lock/package.json trước khi cài dependency production.

### 4.2 Tạo ứng dụng

1. Tạo subdomain `webmail.example.com`, bật AutoSSL và buộc HTTPS.
2. Trong **Setup Node.js App**, chọn Node phù hợp, mode Production, application root `webmail`, URL subdomain, startup file **app.cjs**. Repo cung cấp file này để Passenger nạp được CommonJS và khởi động server ESM đã build.
3. Nếu dùng **Application Manager** của cPanel chuẩn: đăng ký application path `/home/CPANEL_USER/webmail`; nhờ nhà cung cấp cấu hình `PassengerStartupFile app.cjs` trong cấu hình Passenger theo tài liệu cPanel. Giao diện này có thể không có ô startup file. Không sửa tên server/dist/index.js tùy ý.
4. Thêm các biến sau trong giao diện quản lý ứng dụng; thay CPANEL_USER và địa chỉ Stalwart:

```dotenv
NODE_ENV=production
STALWART_URL=https://jmail.vn
APP_SECRET=BI_MAT_NGAU_NHIEN_CUA_BAN
APP_NAME=Webmail
APP_LOGO_URL=
SOURCE_URL=https://github.com/lehuunghi/webmail
STATIC_DIR=/home/CPANEL_USER/webmail/web/dist
SESSION_FILE=/home/CPANEL_USER/webmail/data/sessions.json
TRUST_PROXY=1
IMAGE_PROXY=1
```

Server có thể nạp `.env` từ thư mục ứng dụng; biến môi trường thật được ưu tiên. Trên cPanel, nên nhập biến vào phần Environment variables để Passenger nhận đúng cấu hình. Để Passenger quản lý socket/cổng, không ép PORT nếu nhà cung cấp không yêu cầu. APP_SECRET phải đủ mạnh; server sẽ từ chối khởi động production khi thiếu.

5. Start/Restart app. Nếu có môi trường ảo CloudLinux, chạy lệnh kích hoạt môi trường mà cPanel hiển thị trước khi chạy npm.
6. Mở `https://webmail.example.com/api/health`, rồi đăng nhập bằng tài khoản Stalwart. Trang đăng nhập phải có “Tiếng Việt” và “Đăng nhập”. Thử gửi/nhận một thư bằng tài khoản thật.

Nếu giao diện cPanel mới có **Web Apps** thay vì Application Manager, đăng ký repo/thư mục và cấu hình runtime, startup, biến môi trường tương đương theo nhà cung cấp. Đây không phải các tên menu giống nhau trên mọi hosting. Cấu hình `PassengerStartupFile` ở cấp Apache cần nhà cung cấp/WHM, không chạy lệnh root trong tài khoản shared hosting.

Khi lỗi 503, đọc log ứng dụng trong cPanel và kiểm tra lần lượt: Node version, startup `app.cjs`, dependency, dist, APP_SECRET, quyền đọc mã và quyền ghi `data`. `.env` để ngoài thư mục công khai, quyền 600. File data thuộc tài khoản cPanel đang chạy ứng dụng. Không mở process Node thủ công song song với Passenger trên cùng port để chữa lỗi.

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
| Logo không đổi | Kiểm tra `/api/config` có logoUrl mới; recreate/restart; URL ảnh trực tiếp và HTTPS; logo lỗi dùng ảnh mặc định |
| Cloudflare 502 | Tunnel route sai: cloudflared trong Docker phải tới `http://webmail:8080`, không phải localhost |
| Cloudflare 1033 | Connector chưa kết nối; xem log cloudflared, token và kết nối outbound |
| Cloudflare 526 khi proxy DNS | Origin certificate/tên miền/hạn dùng; cấu hình Full (strict) với chứng chỉ hợp lệ |
| 413 khi tải đính kèm | Đối chiếu MAX_UPLOAD_BYTES, Stalwart, client_max_body_size và giới hạn nhà cung cấp |
| 403 ở API | Truy cập cùng origin, cookie hợp lệ; kiểm tra rule Cloudflare/Access và request, không tắt CSRF |

### Kiểm tra nghiệm thu sau mọi cách cài

1. Truy cập URL HTTPS thật, xác nhận chứng chỉ đúng tên miền và health trả `ok: true`.
2. Đăng nhập tài khoản Stalwart thật; mở một thư và tải một file đính kèm.
3. Gửi thư thử tới địa chỉ bạn kiểm soát; kiểm tra thư đến, thư đã gửi và nhận thư trả lời.
4. Thử Lịch, Danh bạ, Tệp và các quyền tài khoản có hỗ trợ.
5. Kiểm tra mobile, logout/login; không có hai liên kết hướng dẫn/mã nguồn trên login.
6. Restart ứng dụng; phiên đánh dấu thiết bị riêng phải được giữ nếu SESSION_FILE, volume và APP_SECRET được cấu hình đúng. Thiết bị dùng chung có chính sách phiên ngắn hơn.
7. Ghi lại commit/tag, cấu hình, vị trí backup và cách quay lui. Lưu log đã che dữ liệu nhạy cảm nếu nhờ hỗ trợ.

Kiểm thử demo dùng `npm run mock` và STALWART_URL `http://127.0.0.1:8788`, tài khoản `demo@example.com` / mật khẩu `demo`. Chỉ dùng trong môi trường thử nghiệm, không triển khai demo công khai. Test demo không thay thế kiểm thử Stalwart và hosting thật.

## Tài liệu đối chiếu

- cPanel: https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/
- Startup file Passenger: https://support.cpanel.net/hc/en-us/articles/360057519553-How-to-create-a-custom-NodeJS-startup-file
- Portainer stacks: https://docs.portainer.io/user/docker/stacks/add
- Docker Compose: https://docs.docker.com/compose/

Giữ LICENSE và NOTICE trong bản phân phối. Mã nguồn phiên bản này được cung cấp tại repo lehuunghi/webmail; màn hình login và settings/about không còn liên kết giới thiệu/mã nguồn.

## 6. Đổi logo riêng

Đặt trong `.env`:

```dotenv
APP_NAME=Webmail của tôi
APP_LOGO_URL=https://cdn.example.com/logo.png
```

Có thể dùng đường dẫn nội bộ như `/img/logo-rieng.svg` (file đặt trong `web/public/img` rồi build lại). Nếu dùng BASE_PATH, đường dẫn ảnh nội bộ phải chứa tiền tố thật, ví dụ `/mail/img/logo-rieng.svg`. Để trống sẽ dùng logo Webmail mặc định. Logo áp dụng cho login, thanh đầu trang và vùng đọc thư; ảnh lỗi sẽ tự quay về logo mặc định. Nên dùng PNG, WebP hoặc SVG, nền trong suốt và URL HTTPS trỏ trực tiếp tới ảnh. URL không được yêu cầu cookie đăng nhập ở một trang khác; không nhập URL trang xem ảnh hoặc data URL.

Docker Compose tự truyền APP_LOGO_URL từ .env; Portainer nhập biến này trong Environment variables của stack; cPanel nhập vào Environment variables của ứng dụng. Sau khi đổi URL, restart/recreate ứng dụng và tải lại trang. Đây là logo chung của bản cài đặt, không phải tùy chọn riêng của từng tài khoản. Favicon và icon cài ứng dụng vẫn dùng bộ icon mặc định.

Với Docker: `docker compose up -d --force-recreate` để nhận biến mới. URL ảnh ngoài được thêm vào CSP theo đường dẫn cấu hình; nếu URL chuyển hướng sang nơi khác có thể bị chặn, nên dùng URL đích trực tiếp. Không cần build lại khi chỉ đổi URL ngoài; thay file trong web/public thì cần build lại image/bundle.

## 7. Cloudflare: cách triển khai phù hợp

### 7.1 Phân biệt các dịch vụ

| Dịch vụ | Với bản Webmail hiện tại | Có cần máy chủ riêng? |
| --- | --- | --- |
| DNS/proxy Cloudflare | Đặt trước VPS/cPanel đang chạy, origin cần HTTPS hợp lệ | Có |
| Cloudflare Tunnel | Đưa Docker/Node đang chạy ra hostname qua cloudflared; không cần mở cổng inbound cho webmail | Có, máy luôn bật và có mạng |
| Cloudflare Pages | Chỉ tải web/dist không đủ: frontend gọi /api, cần backend và cùng origin | Cần backend riêng hoặc viết adapter |
| Cloudflare Workers | Có một phần tương thích Node; repo chưa có entrypoint và lớp lưu phiên cho Workers | Phải chuyển đổi backend |
| Cloudflare Containers | Có môi trường container Linux, khả thi để chạy image; phải thêm Worker/Durable Object, routing và lưu phiên | Không cần VPS cho Webmail, nhưng Stalwart vẫn phải ở nơi khác |

Đánh giá Pages/Workers ở đây là kết luận từ kiến trúc repo: server dùng tiến trình Node, file tĩnh, phiên trong bộ nhớ và file phiên. Không phải khẳng định Cloudflare hoàn toàn không hỗ trợ Node. Workers có Node compatibility, nhưng file tạm không phải ổ đĩa bền vững. Repo chưa có wrangler config hoặc adapter lưu phiên trên Durable Objects/D1.

Nguồn: [Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/), [Node compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/), [filesystem Workers](https://developers.cloudflare.com/changelog/post/2025-08-15-nodejs-fs/), [Containers](https://developers.cloudflare.com/containers/).

### 7.2 Docker + Cloudflare Tunnel: hướng dẫn từng bước

Sơ đồ: **Trình duyệt HTTPS → Cloudflare → cloudflared trên máy của bạn → webmail:8080 → Stalwart qua HTTPS**. Webmail và cloudflared dùng cùng mạng Compose. Stack này không publish cổng 8080 ra host, nên không dùng curl loopback của phần 2 để kiểm tra nó.

**Bước 1 — Chuẩn bị:** tên miền đã quản lý DNS tại Cloudflare, máy Docker luôn bật, Stalwart truy cập được. Clone đúng nhánh ở phần 2, tạo `.env`, điền STALWART_URL/APP_SECRET và build image:

```sh
docker build --pull -t lehuunghi/webmail:local .
```

**Bước 2 — Tạo tunnel:** trong dashboard Cloudflare tìm Tunnels (tùy giao diện ở Networking hoặc Cloudflare One/Networks/Connectors), tạo Cloudflared tunnel, đặt tên. Ở hướng dẫn cài connector chọn Docker và lấy chuỗi token `eyJ...`. Chỉ dùng token tunnel, không dùng Global API Key. Thêm vào `.env`:

```dotenv
TUNNEL_TOKEN=THAY_BANG_TOKEN_TUNNEL_CUA_BAN
```

Token cho phép chạy connector của tunnel; giữ file `.env` riêng, không đưa vào repo hoặc ảnh chụp. [Hướng dẫn token chính thức](https://developers.cloudflare.com/tunnel/reference/tunnel-tokens/).

**Bước 3 — Khởi chạy:** sử dụng `docker-compose.cloudflare.yml` trong repo:

[Mở file YAML Cloudflare](https://github.com/lehuunghi/webmail/blob/main/docker-compose.cloudflare.yml). Trong bản HTML, nội dung hiện dưới đây để sao chép:

<!-- include:docker-compose.cloudflare.yml -->

```sh
docker compose -f docker-compose.cloudflare.yml config --quiet
docker compose -f docker-compose.cloudflare.yml up -d
docker compose -f docker-compose.cloudflare.yml ps
docker compose -f docker-compose.cloudflare.yml logs --tail=80 webmail cloudflared
```

Phải thấy webmail healthy, connector báo kết nối. Nếu thử chuyển từ cách cài cũ, dừng stack cũ trước, giữ cùng tên project/volume và kiểm tra cấu hình thay vì khởi chạy hai Webmail cùng ghi một file phiên. Chỉ chọn một YAML cho bản chạy.

**Bước 4 — Tạo Published application route:** trên tunnel vừa tạo, thêm hostname `webmail.example.com`, service type **HTTP**, URL **webmail:8080** (đầy đủ là `http://webmail:8080`). Không dùng `localhost:8080` khi cloudflared chạy trong container riêng. Dashboard tạo DNS route tương ứng; xử lý bản ghi hostname cũ nếu báo trùng.

**Bước 5 — Mở HTTPS và kiểm tra:** truy cập `https://webmail.example.com/api/health`, rồi nghiệm thu theo phần 5. Stack đã đặt TRUST_PROXY=1, SECURE_COOKIES=1. HTTP chỉ ở mạng nội bộ tới service; người dùng truy cập HTTPS. Nếu cần Caddy/AutoSSL, đó là cách proxy trực tiếp ở phần 2/4, không phải điều kiện bắt buộc cho HTTP service bên trong tunnel này.

**Bước 6 — Cập nhật:** build image mới, dùng đúng `-f docker-compose.cloudflare.yml` để recreate. Giữ APP_SECRET, volume và token. `cloudflared:latest` là ví dụ dễ bắt đầu; cho production nên khóa phiên bản/digest đã kiểm tra và cập nhật có chủ đích.

Trong Portainer: dán file YAML này vào Web editor, nhập thêm TUNNEL_TOKEN và các biến phần 3, deploy sau khi image local đã có trên đúng host. Không cần chạy lệnh Compose nếu Portainer đang quản lý stack đó.

Nguồn: [tạo tunnel bằng dashboard](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/), [routing tunnel](https://developers.cloudflare.com/tunnel/concepts/routing/), [TUNNEL_TOKEN](https://developers.cloudflare.com/tunnel/guides/kubernetes/). Các bước trên là cấu hình đề xuất cho repo, chưa triển khai lên tài khoản Cloudflare thật.

### 7.3 Cloudflare trước VPS hoặc cPanel đã có HTTPS

Nếu không dùng Tunnel, cài thành công ở phần 2/4 trước. Tạo DNS record cho subdomain webmail trỏ về origin, bật proxy cho hostname webmail, chọn **Full (strict)** và đảm bảo chứng chỉ origin còn hạn/đúng hostname. Không dùng Flexible cho ứng dụng đăng nhập. Đây vẫn là chạy trên VPS/cPanel; Cloudflare làm DNS/proxy, không host process Node.

Không áp dụng Cache Everything lên Webmail. Nếu đã có cache rule rộng, loại trừ hostname webmail hoặc ít nhất /api/*, HTML chính, /sw.js và manifest khỏi ép cache; để /assets/* theo header cache của ứng dụng. Có thể chọn bypass cache cho toàn hostname lúc thiết lập. Kiểm tra giới hạn upload/timeout của gói trước khi tăng kích thước đính kèm. Nếu bật Access, người dùng có thêm một lớp đăng nhập; nghiệm thu cả các request API/sự kiện sau Access.

Hostname SMTP/IMAP của Stalwart thông thường cần **DNS only**; proxy HTTP của Cloudflare không tự chuyển SMTP/IMAP. Không đổi hostname máy thư sang orange cloud chỉ vì webmail dùng proxy. Xem [DNS proxy status](https://developers.cloudflare.com/dns/proxy-status/), [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/), [Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/).

### 7.4 Muốn Webmail chạy trực tiếp trên Cloudflare Containers

**Có thể về mặt nền tảng, nhưng bản repo hiện tại chưa có triển khai hoàn chỉnh.** Cloudflare Containers dùng gói Workers Paid, nhận image Linux/amd64 và được truy cập qua Worker/Durable Object. Không phải dán docker-compose.yml vào dashboard như Portainer. Kiểm tra [giá hiện hành](https://developers.cloudflare.com/containers/pricing/) trước khi tạo môi trường.

Để làm một bản riêng trên Containers, cần:

1. Tạo project Worker/Durable Object và cấu hình Wrangler theo [Get started](https://developers.cloudflare.com/containers/get-started/); dùng Dockerfile của repo và kiến trúc linux/amd64.
2. Truyền STALWART_URL, APP_SECRET bằng secret/env vào container; đặt PORT=8080, STATIC_DIR=/app/web/dist, TRUST_PROXY=1 và SECURE_COOKIES=1. Worker chuyển tiếp path/header/body và response stream đúng, không cache API.
3. Bảo đảm các request của cùng phiên đi tới đúng instance. Không chia ngẫu nhiên mỗi request sang một container vì phiên hiện giữ trong bộ nhớ/file.
4. Chọn cách lưu phiên: với SESSION_FILE để trống, container restart/sleep sẽ làm người dùng đăng nhập lại. Muốn giữ phiên cần thêm lưu trữ bền vững và thiết kế đồng bộ; đĩa container mặc định tạm thời, volume Compose không tự chuyển thành ổ bền vững trên Cloudflare. Snapshot không tự thay thế cập nhật file phiên liên tục.
5. Kiểm tra cold start, sleep, deploy/rollback, file đính kèm, stream sự kiện, rate limit và IP người dùng trước production. Không chỉ kiểm tra trang login hiển thị được.

Đây là danh sách công việc cần triển khai, **không phải bộ lệnh đã kiểm thử sẵn**. Hướng Tunnel ở 7.2 ít thay đổi mã nhất cho phiên bản hiện tại. Nguồn: [Containers overview](https://developers.cloudflare.com/containers/), [vòng đời và đĩa tạm](https://developers.cloudflare.com/containers/concepts/architecture/).

## 8. Sao lưu, cập nhật tài liệu và phạm vi kiểm thử

### 8.1 Ví dụ sao lưu volume Docker

Thực hiện trong thư mục Compose của bản đang chạy. Nếu dùng Tunnel, thay mọi `docker compose` dưới đây bằng `docker compose -f docker-compose.cloudflare.yml`. Dừng Webmail trong lúc sao lưu để file phiên không thay đổi:

```sh
mkdir -p backups
chmod 700 backups
docker compose stop webmail
container_id=$(docker compose ps -aq webmail)
volume_name=$(docker inspect "$container_id" --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}')
test -n "$volume_name" || { echo "Khong tim thay named volume /data"; exit 1; }
docker run --rm -v "$volume_name":/data:ro -v "$PWD/backups":/backup alpine:3.22 \
  sh -c 'tar -czf /backup/sessions-$(date -u +%Y%m%dT%H%M%SZ).tar.gz -C /data .'
docker compose start webmail
```

Ghi lại tên volume, file backup và APP_SECRET tương ứng. Nếu bước backup lỗi, chưa có bản sao hợp lệ; kiểm tra trước khi tiếp tục cập nhật. File phiên có thông tin xác thực được mã hóa; không đưa backup hoặc secret lên thư mục web công khai.

Khi khôi phục, dừng Webmail, sao lưu trạng thái hiện tại trước, xác nhận **đúng volume đích**. Thay BACKUP_FILE bằng tên file có thật trong backups rồi giải nén vào volume đã xác định:

```sh
docker run --rm -v "$volume_name":/data -v "$PWD/backups":/backup:ro alpine:3.22 \
  tar -xzf /backup/BACKUP_FILE.tar.gz -C /data
docker compose start webmail
```

Lệnh khôi phục ghi đè file trùng tên trong volume. Giữ secret gốc và kiểm tra quyền ghi của user node. Với cPanel, dừng/restart theo panel và sao chép thư mục `data` bằng tài khoản hosting; không áp dụng lệnh Docker trên shared hosting.

### 8.2 Những gì cần giữ khi cập nhật

- Lưu bản `.env`/biến Portainer/cPanel, APP_SECRET và tag/commit ở nơi riêng. Sao lưu file phiên khi Webmail đã dừng; dùng Volumes trong Portainer hoặc công cụ backup Docker phù hợp để xuất đúng volume.
- Khi restore, chạy một instance Webmail duy nhất với file phiên và secret tương ứng. Thư, danh bạ/lịch/tệp được lưu theo khả năng Stalwart, nên phải có quy trình backup máy thư riêng.
- File hướng dẫn HTML được sinh từ `docs/CAI-DAT.md` bằng `node scripts/build-guide.mjs`, rồi đi vào web/dist khi build. Sửa Markdown gốc, sinh lại HTML; không chỉ sửa bản web/dist vì lần build sau sẽ ghi đè.
- Trang `/huong-dan.html` truy cập trực tiếp; không nằm trên login hoặc menu tài khoản. Khi dùng BASE_PATH, thêm tiền tố vào URL trang này.
- Đã kiểm tra build/giao diện cục bộ. Docker, Portainer, cPanel và Cloudflare thật cần nghiệm thu trên môi trường của bạn; tài liệu không thay thế kết quả triển khai thực tế.

## Cài đặt với INBUXA hoặc Stalwart

Webmail nhận diện cả `urn:stalwart:jmap` (Stalwart) và `urn:inbuxa:jmap:registry` (INBUXA), rồi dùng capability mà máy chủ công bố khi gửi các phương thức registry `x:`.

Với máy chủ tại jmail.vn, cấu hình **container Webmail hoặc ứng dụng Node.js cPanel**:

```env
STALWART_URL=https://jmail.vn
```

Nếu máy chủ thư là **INBUXA**, thêm cấu hình sau vào môi trường của **máy chủ/container INBUXA** rồi khởi động lại INBUXA:

```env
INBUXA_HTTP_BASIC_AUTH=all
```

Không đặt `INBUXA_HTTP_BASIC_AUTH` trong container Webmail: biến này điều khiển xác thực HTTP Basic của INBUXA. Khi dùng Portainer, sửa Environment/Stack của dịch vụ INBUXA, không phải stack Webmail. Nếu INBUXA được quản lý bởi nhà cung cấp, yêu cầu nhà cung cấp bật cấu hình này.

Sau khi khởi động lại máy chủ, mở Webmail và đăng nhập bằng tài khoản thư thật. Stalwart không cần biến INBUXA này; giữ cấu hình xác thực của Stalwart. Với máy chủ khác, đổi `STALWART_URL` thành URL gốc của máy chủ đó, không thêm `/jmap` hay `/.well-known/jmap`.
