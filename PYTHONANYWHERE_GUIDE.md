# دليل رفع المشروع على PythonAnywhere

## ✅ PythonAnywhere مناسب جداً لرفع Backend!

PythonAnywhere أسهل من Railway في بعض الحالات ويدعم Flask بشكل ممتاز.

---

## الخطوات التفصيلية

### الخطوة 1: إنشاء حساب على PythonAnywhere

1. اذهب إلى [pythonanywhere.com](https://www.pythonanywhere.com)
2. اضغط "Pricing" → اختر "Beginner" (مجاني) أو "Hacker" (مدفوع)
3. سجل حساب جديد
4. تأكد الحساب

### الخطوة 2: رفع الملفات على PythonAnywhere

#### الطريقة A: رفع من GitHub (الأسهل)

1. **في PythonAnywhere:**
   - اضغط على "Files" في القائمة العلوية
   - اضغط على "Bash console here"

2. **في Console:**
   ```bash
   # استنسخ repository من GitHub
   git clone https://github.com/YOUR_USERNAME/chat-app.git
   cd chat-app
   ```

#### الطريقة B: رفع يدوي

1. **في PythonAnywhere:**
   - اضغط على "Files"
   - اذهب إلى مجلد `home/YOUR_USERNAME/`
   - اضغط "Upload a file"
   - ارفع الملفات:
     - `app.py`
     - `requirements.txt`
     - مجلد `CSS/`
     - مجلد `JS/`
     - `chat.html`
     - `login-register.html`

### الخطوة 3: تثبيت المكتبات

1. **في Console (Bash):**
   ```bash
   pip3.10 install --user flask flask-cors werkzeug
   ```
   
   أو إذا كان لديك `requirements.txt`:
   ```bash
   pip3.10 install --user -r requirements.txt
   ```

### الخطوة 4: إنشاء Web App

1. **في PythonAnywhere:**
   - اضغط على "Web" في القائمة العلوية
   - اضغط "Add a new web app"
   - اختر "Flask"
   - اختر Python version (3.10 أو أحدث)
   - أدخل مسار الملف: `home/YOUR_USERNAME/chat-app/app.py`
   - أو: `home/YOUR_USERNAME/app.py` (إذا رفعت الملفات مباشرة)

### الخطوة 5: إعداد WSGI Configuration

1. **في صفحة Web App:**
   - اضغط على "WSGI configuration file"
   - احذف كل شيء واكتب:
   ```python
   import sys
   import os

   # إضافة مسار المشروع
   path = '/home/YOUR_USERNAME/chat-app'  # غير YOUR_USERNAME
   if path not in sys.path:
       sys.path.insert(0, path)

   # استيراد Flask app
   from app import app as application

   if __name__ == "__main__":
       application.run()
   ```
   - احفظ الملف

### الخطوة 6: الحصول على الرابط

1. **في صفحة Web App:**
   - ابحث عن "Reload" أو "Reload web app"
   - اضغط عليها
   - ستحصل على رابط مثل:
     ```
     https://YOUR_USERNAME.pythonanywhere.com
     ```
   - هذا هو رابط Backend الخاص بك! ✅

---

## الخطوة 7: تحديث Frontend

بعد الحصول على رابط PythonAnywhere:

### في `JS/chat.js` (السطر 1):
```javascript
const API_URL = 'https://YOUR_USERNAME.pythonanywhere.com';
```

### في `JS/script.js` (السطر 55 و 133):
```javascript
url: 'https://YOUR_USERNAME.pythonanywhere.com/login',
url: 'https://YOUR_USERNAME.pythonanywhere.com/register',
```

---

## ملاحظات مهمة

### 1. قاعدة البيانات:
- PythonAnywhere سينشئ قاعدة بيانات جديدة
- المستخدمين المسجلين محلياً لن يظهرون
- هذا طبيعي ✅

### 2. تحديث الكود:
- إذا أردت تحديث الكود:
  - ارفع الملفات الجديدة
  - اضغط "Reload" في صفحة Web App

### 3. Logs:
- لرؤية الأخطاء:
  - اذهب إلى "Web" → "Error log"
  - أو "Server log"

### 4. الحساب المجاني:
- ⚠️ الحساب المجاني له قيود:
  - لا يمكن الوصول للـ Backend من خارج PythonAnywhere (أحياناً)
  - قد تحتاج لحساب مدفوع للاستخدام الكامل
  - أو يمكنك طلب "IP whitelist" من الدعم

---

## حل المشاكل الشائعة

### المشكلة: "Module not found"
**الحل:**
```bash
pip3.10 install --user flask flask-cors werkzeug
```

### المشكلة: "Cannot connect"
**الحل:**
- تأكد أن Web App يعمل (Status: Running)
- تحقق من Error log
- تأكد من أن WSGI configuration صحيح

### المشكلة: "CORS error"
**الحل:**
- تأكد أن `CORS(app)` موجود في `app.py` ✅
- قد تحتاج لتحديث `CORS` في PythonAnywhere:
  ```bash
  pip3.10 install --user --upgrade flask-cors
  ```

---

## مقارنة PythonAnywhere vs Railway

| الميزة | PythonAnywhere | Railway |
|--------|----------------|---------|
| سهولة الاستخدام | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| مجاني | ✅ (محدود) | ✅ (أفضل) |
| دعم Flask | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| سهولة النشر | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**الخلاصة:** PythonAnywhere أسهل للمبتدئين! ✅

---

## الخطوات السريعة

1. ✅ سجل حساب على [pythonanywhere.com](https://www.pythonanywhere.com)
2. ✅ ارفع الملفات (من GitHub أو يدوياً)
3. ✅ ثبت المكتبات: `pip3.10 install --user flask flask-cors werkzeug`
4. ✅ أنشئ Web App (Flask)
5. ✅ عدّل WSGI configuration
6. ✅ اضغط "Reload"
7. ✅ انسخ الرابط: `https://YOUR_USERNAME.pythonanywhere.com`
8. ✅ غيّر `API_URL` في `chat.js` و `script.js`

---

## رابط مفيد

- [PythonAnywhere Documentation](https://help.pythonanywhere.com/pages/Flask/)

**PythonAnywhere خيار ممتاز! 🎉**

