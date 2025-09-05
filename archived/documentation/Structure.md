autodevelop.ai/
├── client/                         # React frontend
│   ├── public/                    # Static assets + favicon
│   ├── src/
│   │   ├── components/           # Floating header, button, footer, etc.
│   │   ├── pages/                # Home, About, Contact, BotExperience
│   │   ├── bot/                  # Bot UI + Prompts
│   │   └── App.jsx               # Main layout and router
│   └── README.md                 # Instructions for running frontend
│
├── server/                        # Backend API
│   ├── routes/
│   │   ├── contact.js            # Handles contact form submissions
│   │   ├── newsletter.js        # Collects user emails + preferences
│   ├── bot/                      # Interfaces with OpenAI
│   ├── models/                   # Database schemas if needed
│   ├── README.md                 # Server setup instructions
│
├── vercel.json                   # Vercel deployment config
├── .env.example                  # Environment variable guide
└── README.md                     # Master README
