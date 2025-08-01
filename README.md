# 📚 Learnometer – Personalized Learning Tracker

Learnometer is a full-stack web application designed to help learners track their courses, receive personalized guidance from mentors, and build daily learning habits. It supports role-based dashboards (Admin, Learner, Mentor), OTP verification, audio feedback, and more.

---

## 🚀 Features

- ✍️ Role-based Registration and Dashboards (Learner, Mentor, Admin)
- ✅ OTP Verification via Email & Phone
- 📖 Course, Main Topic, and Subtopic Tracking
- 🔄 Daily Habit Tracker for Learners
- 🧑‍🏫 Mentor Profile Management & Session Availability
- 🎧 Audio Feedback with Cloudinary Integration
- 💳 Stripe-based Payment Handling (Premium Learner Access)
- 📊 Admin Panel for User & Quote Management

---

## 🛠️ Tech Stack

**Frontend:**
- React + Vite
- Tailwind CSS
- Redux Toolkit
- React Router DOM
- Axios

**Backend:**
- Django
- Django REST Framework
- JWT Authentication
- PostgreSQL
- Stripe Webhooks
- Cloudinary Media Upload

---

## 📦 Project Folder Structure

```

learnometer/
├── backend/
│   ├── adminpanel/
│   ├── chat/
│   ├── core/
│   ├── courses/
│   ├── habits/
│   ├── logs/
│   ├── mentorship/
│   ├── permium/
│   ├── topics/
│   ├── users/
│   ├── venv/
│   ├── .env
│   ├── .gitignore
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── .vite/
│   ├── node\_modules/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── app.css
│   │   ├── app.jsx
│   │   ├── axios.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
│
├── .gitignore
└── README.md

````

---

## 🖥️ Screenshots

> Add your images in a `/screenshots/` folder and link them below.

- Learner Dashboard  
  ![Learner Dashboard](screenshots/learner-dashboard.png)

- Mentor Profile Edit Modal  
  ![Mentor Profile](screenshots/mentor-profile.png)

- OTP Verification  
  ![OTP Verification](screenshots/otp-verification.png)

---

## 🧪 Installation

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.8
- PostgreSQL
- Cloudinary & Stripe Accounts

### 1. Clone the Repository

```bash
git clone https://github.com/SwalihAlif/learnometer.git
cd learnometer
````

### 2. Setup Backend (Django)

```bash
cd backend
python -m venv env
source env/bin/activate  # or env\Scripts\activate on Windows
pip install -r requirements.txt

# Update .env with your DB, JWT, Cloudinary, Stripe keys
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### 3. Setup Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

---

## 👤 User Roles

* **Admin** – Manage users, review quotes, monitor system.
* **Learner** – Track courses, update goals, receive feedback.
* **Mentor** – Set availability, manage expertise, view learners.

---

## 🔐 OTP Verification

After registering, users are redirected to an OTP page. OTP is sent to both email and phone. Access is granted only after verification.

---

## 🧠 Habit Tracker

Learners can set, update, and visualize learning habits. Progress is tracked weekly and motivational quotes are displayed.

---

## 📤 Feedback System

* Mentors can give motivational audio feedback to learners.
* Cloudinary is used for audio upload and playback.
* Admin approves quotes and feedback.

---

## 🧑‍💻 Contributing

Contributions are welcome! Follow these steps:

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request



## 📫 Contact

* Email: [forcheckingswalih@gmail.com](mailto:forcheckingswalih@gmail.com)
* GitHub: [SwalihAlif](https://github.com/SwalihAlif)
