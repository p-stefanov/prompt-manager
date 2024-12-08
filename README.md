# Setup the frontend server:
(from https://ui.shadcn.com/docs/installation/next)
```bash
cd frontend
npx shadcn@latest init -d
```

# Run the frontend server:
```bash
cd frontend/my-app
npm run dev
```

# Run the backend server:
```bash
cd backend
fastapi dev app.py
```

# Usage:
```bash
curl -X PUT -H 'content-type: application/json' http://127.0.0.1:8000/fake/bash -d $'{"system_message": "I want you to act as a linux terminal. I will type commands and you will reply with what the terminal should show. I want you to only reply with the terminal output inside one unique code block, and nothing else. do not write explanations. do not type commands unless I instruct you to do so. When I need to tell you something in English, I will do so by putting text inside curly brackets {like this}.", "user_message": "{{ user_input | check_profanity }}"}'

curl -X GET -H 'content-type: application/json' http://127.0.0.1:8000/fake/bash

curl -X POST -H 'content-type: application/json' http://127.0.0.1:8000/fake/bash -d '{"user_input": "ls"}'
```

# Tables:
```sql
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL UNIQUE,
    system_message TEXT,
    user_message TEXT NOT NULL
);
```
