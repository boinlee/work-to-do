# Supabase 설정 가이드

## 1단계: Supabase 계정 생성

1. [supabase.com](https://supabase.com) 접속
2. **Start your project** 또는 **Sign Up** 클릭
3. GitHub 계정으로 로그인 (가장 간편)

## 2단계: 새 프로젝트 생성

1. 대시보드에서 **New Project** 클릭
2. 설정 입력:
   - **Project name**: `work-to-do` (원하는 이름)
   - **Database Password**: 안전한 비밀번호 설정
   - **Region**: `Northeast Asia (Seoul)` 선택
3. **Create new project** 클릭
4. 프로젝트 생성 완료까지 1~2분 대기

## 3단계: 데이터베이스 스키마 설정

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. **New Query** 클릭
3. `supabase/schema.sql` 파일의 내용을 전체 복사하여 붙여넣기
4. **Run** 버튼 클릭
5. 모든 쿼리가 성공적으로 실행되었는지 확인

## 4단계: 인증 마이그레이션 실행 ⚠️ 중요

1. SQL Editor에서 **New Query** 클릭
2. `supabase/auth-migration.sql` 파일의 내용을 전체 복사하여 붙여넣기
3. **Run** 버튼 클릭
4. 이 스크립트는 다음을 설정합니다:
   - Supabase Auth 사용자 등록 시 자동으로 public.users에 프로필 생성
   - 인증된 사용자만 데이터에 접근하도록 RLS 정책 업데이트

## 5단계: 이메일 인증 설정 (선택사항)

> 개발 중에는 이메일 확인을 비활성화하면 회원가입 시 바로 사용 가능하여 편리합니다.

1. **Authentication** > **Providers** 이동
2. **Email** 섹션의 **Confirm email** 체크 해제 (개발 시 권장)
3. 실제 서비스 시에는 이메일 소유권 확인을 위해 체크 유지 권장

## 6단계: API 키 확인 및 환경 변수 설정

1. Supabase 대시보드 > **Settings** (톱니바퀴) > **API**
2. 다음 두 값을 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon (public)** key: `eyJhbGci...`
3. `.env.local` 파일 수정:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...여기에_복사한_키_붙여넣기
```

## 7단계: Realtime 활성화 확인

1. **Database** > **Replication** 이동
2. 다음 테이블들이 활성화되어 있는지 확인:
   - `tasks`, `comments`, `projects`, `project_members`

## 8단계: 앱 실행

```bash
cd work-to-do
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 인증 흐름

### 이메일 회원가입 및 로그인
1. 로그인 페이지에서 이메일과 비밀번호를 입력합니다.
2. 처음 이용하시는 경우 **회원가입**을 눌러 계정을 생성한 후 가입을 완료합니다.
3. 기존 회원인 경우 이메일과 비밀번호를 입력하고 **로그인**을 누릅니다.

---

## 문제 해결

### "Invalid login credentials" 에러
→ 이메일 또는 비밀번호가 잘못되었습니다.

### "User already registered" 에러
→ 이미 가입된 이메일입니다. "로그인" 모드로 전환한 후 로그인하세요.

### RLS 관련 에러
→ SQL Editor에서 `auth-migration.sql`을 다시 실행하세요.
