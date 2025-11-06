# دليل رفع المشروع على GitHub Pages

## ⚠️ ملاحظة مهمة

**GitHub Pages يدعم فقط المواقع الثابتة (HTML/CSS/JS)**
- Frontend سيعمل بشكل جيد ✅
- Backend (Flask) **لن يعمل** ❌

لذلك ستحتاج إلى:
1. رفع Frontend على GitHub Pages
2. رفع Backend على خدمة أخرى (Railway, Render, Heroku)

---

## الطريقة 1: رفع Frontend على GitHub Pages

### الخطوة 1: إنشاء Repository على GitHub

1. اذهب إلى [GitHub.com](https://github.com)
2. اضغط على علامة `+` في الأعلى
3. اختر "New repository"
4. املأ البيانات:
   - **Repository name:** `chat-app` (أو أي اسم تريده)
   - **Description:** `Real-time chat application`
   - **Public** (اختر Public لأن GitHub Pages المجاني يتطلب Public repository)
5. اضغط "Create repository"

### الخطوة 2: إعداد Git في المشروع

افتح PowerShell أو Command Prompt في مجلد المشروع:

```bash
# اذهب لمجلد المشروع
cd C:\Users\tarek\Desktop\chat

# تهيئة Git
git init

# إضافة جميع الملفات
git add .

# عمل commit أولي
git commit -m "Initial commit: Chat application"
```

### الخطوة 3: ربط المشروع بـ GitHub

```bash
# استبدل YOUR_USERNAME باسم المستخدم الخاص بك
git remote add origin https://github.com/YOUR_USERNAME/chat-app.git

# تغيير اسم الفرع إلى main
git branch -M main

# رفع الملفات
git push -u origin main
```

**ملاحظة:** سيطلب منك إدخال:
- **Username:** اسم المستخدم على GitHub
- **Password:** استخدم Personal Access Token (ليس كلمة المرور العادية)

### كيفية إنشاء Personal Access Token:

1. اذهب إلى GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token (classic)
4. اختر الصلاحيات: `repo` (كلها)
5. اضغط "Generate token"
6. انسخ الـ Token (سيظهر مرة واحدة فقط)
7. استخدمه كـ Password عند الرفع

### الخطوة 4: تفعيل GitHub Pages

1. اذهب إلى repository على GitHub
2. اضغط على "Settings" (في الأعلى)
3. من القائمة الجانبية، اضغط "Pages"
4. تحت "Source":
   - Branch: اختر `main`
   - Folder: اختر `/ (root)`
5. اضغط "Save"
6. انتظر دقيقة أو دقيقتين
7. موقعك سيكون متاحاً على:
   ```
   https://YOUR_USERNAME.github.io/chat-app/
   ```

---

## الطريقة 2: رفع Backend على Railway (مجاني)

### الخطوة 1: إنشاء حساب على Railway

1. اذهب إلى [railway.app](https://railway.app)
2. اضغط "Start a New Project"
3. سجل دخول باستخدام GitHub

### الخطوة 2: رفع المشروع

1. اختر "Deploy from GitHub repo"
2. اختر repository الخاص بك
3. Railway سيبدأ في بناء المشروع تلقائياً
4. بعد البناء، سيحصل Backend على رابط مثل:
   ```
   https://your-app-name.railway.app
   ```

### الخطوة 3: تحديث Frontend

1. افتح `JS/chat.js`
2. غيّر `API_URL` إلى رابط Railway:
   ```javascript
   const API_URL = 'https://your-app-name.railway.app';
   ```
3. احفظ الملف

### الخطوة 4: رفع التغييرات

```bash
git add .
git commit -m "Update API URL for production"
git push
```

---

## الطريقة 3: رفع Backend على Render (مجاني)

### الخطوة 1: إنشاء حساب

1. اذهب إلى [render.com](https://render.com)
2. سجل دخول باستخدام GitHub

### الخطوة 2: إنشاء Web Service

1. اضغط "New" → "Web Service"
2. اختر repository الخاص بك
3. املأ البيانات:
   - **Name:** `chat-backend` (أو أي اسم)
   - **Region:** اختر الأقرب لك
   - **Branch:** `main`
   - **Root Directory:** (اتركه فارغاً)
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python app.py`
4. اضغط "Create Web Service"
5. Render سيعطيك رابط مثل:
   ```
   https://chat-backend.onrender.com
   ```

### الخطوة 3: تحديث Frontend

نفس الخطوات كما في Railway، لكن استخدم رابط Render.

---

## ملخص الخطوات السريعة

### للرفع على GitHub Pages فقط:

```bash
cd C:\Users\tarek\Desktop\chat
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/chat-app.git
git branch -M main
git push -u origin main
```

ثم في GitHub:
- Settings → Pages → Source: main → Save

### للرفع على Railway + GitHub Pages:

1. ارفع على GitHub (كما في الأعلى)
2. ارفع Backend على Railway
3. غيّر `API_URL` في `chat.js`
4. ارفع التغييرات مرة أخرى

---

## نصائح مهمة

1. **لا ترفع ملفات قاعدة البيانات:**
   - ملف `chat.db` موجود في `.gitignore` ولن يُرفع ✅

2. **تأكد من رفع ملفات مهمة:**
   - `app.py`
   - `requirements.txt`
   - جميع ملفات HTML/CSS/JS

3. **للـ Backend على Railway/Render:**
   - يجب تغيير `app.py` ليعمل على المنفذ الصحيح:
   ```python
   if __name__ == '__main__':
       port = int(os.environ.get('PORT', 5000))
       app.run(debug=False, host='0.0.0.0', port=port)
   ```

4. **اختبار:**
   - افتح الموقع بعد الرفع
   - تأكد أن الصفحة تفتح بدون أخطاء
   - جرب تسجيل مستخدم جديد

---

## حل المشاكل الشائعة

### المشكلة: "Cannot connect to server"
**الحل:** تأكد أن Backend يعمل على Railway/Render

### المشكلة: "404 Not Found"
**الحل:** تأكد من مسار الصفحات في GitHub Pages

### المشكلة: "CORS error"
**الحل:** تأكد أن `CORS(app)` موجود في `app.py` ✅

---

## روابط مفيدة

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)

