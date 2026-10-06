# Webmail — tiếng Việt và giao diện kiểu Gmail

Bản tùy chỉnh của [Coffey-Labs/ihasmail](https://github.com/Coffey-Labs/ihasmail),
duy trì mã nguồn tại [lehuunghi/webmail](https://github.com/lehuunghi/webmail).

- **Tiếng Việt:** là ngôn ngữ mặc định ngay ở màn hình đăng nhập; có thể đổi trong
  **Settings → Appearance → Interface language**. Bản dịch gồm thư, lịch, danh bạ,
  tệp, cài đặt và quyền quản trị. Beta cho đến khi được người bản ngữ duyệt.
- **Giao diện Webmail:** nền sáng, các khung và nút góc vuông, nút Soạn thư xanh nhạt,
  danh sách thư toàn chiều rộng, hỗ trợ cả chế độ tối và màn hình nhỏ. Thanh Thư / Lịch / Danh bạ / Tệp gọn hơn, chữ 12px và icon 22px rõ nét.
- Người dùng mới mặc định dùng chủ đề **Webmail**, chế độ sáng và ẩn ngăn đọc.
  Tài khoản đã lưu cài đặt vẫn giữ lựa chọn cũ; vào **Settings → Appearance**
  chọn **Webmail / Light**, và **General → Reading pane → Off** nếu muốn bố cục mới.
- Ngôn ngữ tiếng Anh là dự phòng khi thiếu bản dịch; có thể chuyển ngôn ngữ bất cứ lúc nào.

## Container tự động trên GHCR

Workflow tự build khi cập nhật `main` hoặc tạo tag `v*`, rồi đẩy image
`ghcr.io/lehuunghi/webmail` cho AMD64 và ARM64. Xem [hướng dẫn GHCR](docs/GHCR.md).


## Hướng dẫn cài đặt bản riêng

Đọc [hướng dẫn tiếng Việt](docs/CAI-DAT.md) để cài bằng Docker, Portainer hoặc Node.js trên cPanel. Bản hướng dẫn trên trình duyệt nằm tại `/huong-dan.html`. Image `lehuunghi/webmail:local` được build từ chính repo này, không phải image có sẵn trên Docker Hub.

Có hướng dẫn Cloudflare Tunnel và stack `docker-compose.cloudflare.yml` để chạy Webmail trên máy Docker riêng qua tên miền Cloudflare. Pages/Workers chưa chạy nguyên repo; Containers cần tích hợp Worker/Durable Object và xử lý lưu phiên trước khi triển khai trực tiếp.

## Chạy thử

Yêu cầu Node.js theo `package.json` (CI của dự án gốc dùng Node.js 26).

```bash
npm ci --ignore-scripts
npm run dev:mock
```

Mở `http://localhost:5173`, dùng tài khoản mẫu **demo@example.com / demo**.
Đây là dữ liệu giả để thử giao diện; không dùng mock cho hệ thống thật.

## Triển khai với hộp thư thật

Ứng dụng cần **Stalwart Mail Server 0.16 trở lên**, hỗ trợ JMAP. Giao diện kiểu
Gmail không tự kết nối với dịch vụ Gmail của Google.

```bash
cp .env.example .env
# Đặt STALWART_URL trỏ đến máy chủ Stalwart của bạn.
# Tạo APP_SECRET riêng theo hướng dẫn trong .env.example.
docker compose up --build -d
```

`APP_NAME` mặc định là `Webmail`; `SOURCE_URL` mặc định trỏ tới repo này.
Giữ đường dẫn mã nguồn đúng với bản đang triển khai theo giấy phép AGPL-3.0-or-later.
Hướng dẫn và ghi công của dự án gốc được giữ nguyên bên dưới.

---

<p align="center">
  <img src="web/public/img/logo.png" alt="ihasmail" width="150">
</p>

<p align="center">
  <strong><a href="https://demo.ihasmail.com">Try the demo</a></strong><br>
  <sub>A working copy with an invented mailbox behind it — no sign-up, nothing real, nothing kept.</sub>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: AGPL-3.0-or-later" src="https://img.shields.io/badge/license-AGPL--3.0--or--later-2dd4bf?style=flat-square"></a>
  <a href="https://stalw.art" target="_blank" rel="noreferrer"><img alt="Requires Stalwart 0.16 or newer; tested against 0.16.22" src="https://img.shields.io/badge/Stalwart-0.16.22-6366f1?style=flat-square"></a>
  <a href="https://docs.ihasmail.org" target="_blank" rel="noreferrer"><img alt="Documentation: docs.ihasmail.org" src="https://img.shields.io/badge/docs-docs.ihasmail.org-0ea5e9?style=flat-square"></a>
  <a href="https://coffeylabs.org" target="_blank" rel="noreferrer"><img alt="by Coffey Labs" src="https://img.shields.io/badge/by-Coffey%20Labs-0f766e?style=flat-square"></a>
</p>

# ihasmail

> [!NOTE]
> Development happens on [git.coffeylabs.org/coffey-labs/ihasmail](https://git.coffeylabs.org/coffey-labs/ihasmail); the copy on GitHub is a read-only mirror.
> Report issues at **[git.coffeylabs.org/coffey-labs/ihasmail/issues](https://git.coffeylabs.org/coffey-labs/ihasmail/issues)**, and join discussions at **[community.coffeylabs.org](https://community.coffeylabs.org)**.

**Immutable webmail for [Stalwart Mail Server](https://stalw.art).** Mail,
calendars, contacts, files and filters in one app that works as well on a phone
as on a desktop — and a container with nothing to persist.

ihasmail talks only JMAP to Stalwart. There is no database, no IMAP or SMTP,
and with `IMMUTABLE=1` no writable filesystem either: everything durable,
settings included, belongs to Stalwart, so the container is disposable.

| | |
| --- | --- |
| 🌐 **[ihasmail.org](https://ihasmail.org)** | What it is, what it looks like, the full feature list |
| 📘 **[docs.ihasmail.org](https://docs.ihasmail.org)** | [Installing](https://docs.ihasmail.org/install/) · [Configuring](https://docs.ihasmail.org/configure/) · [Using it](https://docs.ihasmail.org/using/) · [Shortcuts](https://docs.ihasmail.org/shortcuts/) · [Rebranding](https://docs.ihasmail.org/rebranding/) · [Troubleshooting](https://docs.ihasmail.org/troubleshooting/) |
| 📋 **[FEATURES.md](FEATURES.md)** | Everything it does, feature by feature, with the capability each one needs |
| 🧪 **[KNOWN-ISSUES.md](KNOWN-ISSUES.md)** | What was verified live, and where Stalwart departs from a spec |
| 🛣 **[ROADMAP.md](ROADMAP.md)** | What ihasmail does not do, and why |

## Screenshots

| | |
| --- | --- |
| **Inbox & conversation (dark)** ![Inbox, dark theme](screenshots/inbox-dark.jpg) | **Inbox & conversation (light)** ![Inbox, light theme](screenshots/inbox-light.jpg) |
| **Composer** ![Composer](screenshots/compose.jpg) | **Calendar** ![Calendar](screenshots/calendar.jpg) |
| **Contacts** ![Contacts](screenshots/contacts.jpg) | **Sieve filter builder** ![Filters](screenshots/filters.jpg) |

Taken against the built-in mock with sample data. More, including the phone
layout, on [ihasmail.org](https://ihasmail.org/#screenshots).

## What's in it

- **Mail** — conversations, labels, search operators, keyboard shortcuts, scheduled and undo send, invitations and RSVP, filters made from a message
- **Calendar** — month, week, day and agenda views, recurrence, attendees and free-busy
- **Contacts** — address books, groups, vCard import and export
- **Files** — browse, upload, move, share
- **Signature checking** — S/MIME signed mail verified as you read it
- **Settings that follow the account**, kept in the account's own storage on Stalwart
- **On a phone** — swipe to archive or delete, pull to refresh, hold to select
- **Administration** — a dashboard, accounts, groups, mailing lists, roles, tenants and domains, each shown only when the Stalwart role allows it
- **Ten interface languages and twelve themes** — Dutch has been read by a native speaker; the other eight translations are marked Beta until one has
- **Platform** — installable PWA, Web Push, `mailto:` handler, no credentials in the browser, strict CSP

The long version is [FEATURES.md](FEATURES.md) and
[ihasmail.org](https://ihasmail.org/#features).

## Requirements

**Stalwart 0.16 or newer** — sign-in refuses anything older, by name. Tested
against 0.16.22; what changed in each release is in
[KNOWN-ISSUES.md](KNOWN-ISSUES.md).

- **No Stalwart yet?** [ihasmail-oneshot](https://git.coffeylabs.org/coffey-labs/ihasmail-oneshot) deploys a new Stalwart and ihasmail together on one host, in one command.
- **On Stalwart 0.15?** [stalwart-migrator](https://git.coffeylabs.org/coffey-labs/stalwart-migrator) upgrades it in place, or stay on the [`stalwart-0.15-support`](https://git.coffeylabs.org/coffey-labs/ihasmail/releases/tag/stalwart-0.15-support) release.

## Quick start (Docker)

```bash
cp .env.example .env
# edit: STALWART_URL=https://jmail.vn  and  APP_SECRET=$(openssl rand -base64 48)
docker compose up --build -d
# → http://localhost:8080 — put a reverse proxy in front for TLS
```

Or pull the published image, `registry.coffeylabs.org/coffey-labs/ihasmail`. Releases are
weekly, so it is usually a few days behind `main`.

People sign in with their Stalwart mailbox credentials. **An account with
two-factor authentication needs an app password**, created in Stalwart's own
settings.

Everything else — TLS, running immutably, several Stalwart servers, settings
the installation decides, every environment variable — is in
[Installing](https://docs.ihasmail.org/install/) and
[Configuring](https://docs.ihasmail.org/configure/).

## Development

```bash
npm install
npm run dev:mock     # built-in mock Stalwart (demo@example.com / demo)
npm test
```

Architecture, the mock's switches and how versions are numbered are in
[CONTRIBUTING.md](CONTRIBUTING.md#development-setup).

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) ·
[SECURITY.md](SECURITY.md) — please report vulnerabilities privately.

## License

Copyright (C) 2026 Coffey Labs — AGPL-3.0-or-later. See [LICENSE](LICENSE).

If you run a modified ihasmail, set `SOURCE_URL` to your own repository: the
sign-in page and Settings › About both show it. See
[Rebranding](https://docs.ihasmail.org/rebranding/).

### INBUXA compatibility

The Webmail fork supports registry capabilities `urn:stalwart:jmap` and `urn:inbuxa:jmap:registry`, selecting the capability advertised by the JMAP session for registry requests. Set `STALWART_URL=https://jmail.vn` in Webmail. For INBUXA, enable `INBUXA_HTTP_BASIC_AUTH=all` in the **INBUXA server environment**, then restart INBUXA; this variable does not belong in the Webmail container. See the Vietnamese installation guide for deployment details.
