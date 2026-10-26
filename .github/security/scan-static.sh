#!/usr/bin/env bash
# فحص ثابت (قراءة بس) لملفات الواجهة. بيطبع التحذيرات ويفشل لو لقى مشاكل عالية الخطورة.
# المكان: .github/security/scan-static.sh  (الجذر = مجلدين فوق)

cd "$(dirname "$0")/../.." || exit 1
FILES=$(ls *.js *.html 2>/dev/null)
problems=0

echo "== 1) مفاتيح سرية في الواجهة (خطورة عالية)"
if grep -nE "service_role|sb_secret_|GROQ_API_KEY|GEMINI_API_KEY" $FILES 2>/dev/null; then
  problems=$((problems+1)); echo "!! لقيت مفتاح سري في ملفات الواجهة"
else echo "ok"; fi

echo "== 2) eval أو new Function (خطورة عالية)"
if grep -nE "\beval\(|new Function\(" $FILES 2>/dev/null; then
  problems=$((problems+1))
else echo "ok"; fi

echo "== 3) innerHTML فيه متغيرات من غير esc() (خطورة متوسطة، راجعها يدوياً)"
grep -nE "innerHTML.*\\$\{" $FILES 2>/dev/null | grep -v "esc" || echo "ok"

echo "== 4) روابط http:// غير مشفرة (خطورة منخفضة)"
grep -nE "[\"']http://" $FILES 2>/dev/null | grep -v "localhost" || echo "ok"

echo "== 5) سكريبتات خارجية من غير نسخة محددة (خطورة متوسطة)"
grep -nE "<script[^>]+src=\"https?://" *.html 2>/dev/null | grep -vE "@[0-9]" || echo "ok"

echo
if [ "$problems" -gt 0 ]; then
  echo "فيه $problems مشكلة عالية الخطورة، راجعها."
  exit 1
fi
echo "مفيش مشاكل عالية الخطورة في الفحص ده."
