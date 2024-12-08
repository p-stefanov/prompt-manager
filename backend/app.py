from contextlib import asynccontextmanager
import logging
import os
from typing import Optional

from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from jinja2 import TemplateError, Environment, FileSystemLoader, select_autoescape
from jinja2.sandbox import ImmutableSandboxedEnvironment
from pydantic import BaseModel
from psycopg_pool import AsyncConnectionPool
from psycopg.rows import dict_row


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncConnectionPool(conninfo="dbname='postgres'") as pool:
        app.async_pool = pool
        yield


app = FastAPI(lifespan=lifespan)
logger = logging.getLogger("uvicorn.error")
tmpl_env_db = ImmutableSandboxedEnvironment()
tmpl_env_app = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "app_templates")),
    autoescape=select_autoescape(["html", "xml"]),
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BadPromptUsageError(Exception):
    pass


def check_profanity(text):
    if "fuck" in text.lower():
        raise BadPromptUsageError("don't curse pls")
    return text


tmpl_env_db.filters["check_profanity"] = check_profanity


async def get_all_prompts_db():
    query = "SELECT * FROM prompt_templates ORDER BY path"
    async with app.async_pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(query)
            result = await cur.fetchall()
            return result


async def get_prompt_db(prompt_id):
    query = "SELECT * FROM prompt_templates WHERE path = %s"
    async with app.async_pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(query, (prompt_id,))
            result = await cur.fetchone()
            return result


async def update_prompt_db(prompt_id, system_message, user_message):
    query = """
INSERT INTO prompt_templates (path, system_message, user_message)
VALUES (%s, %s, %s)
ON CONFLICT (path) DO UPDATE
  SET system_message = excluded.system_message,
      user_message = excluded.user_message
    """.strip()
    async with app.async_pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(query, (prompt_id, system_message, user_message))


async def delete_prompt_db(prompt_id):
    query = "DELETE FROM prompt_templates WHERE path = %s"
    async with app.async_pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(query, (prompt_id,))


@app.get("/")
async def home(content_type: Optional[str] = Header(None)):
    prompts = await get_all_prompts_db()
    if content_type == "application/json":
        return prompts
    template = tmpl_env_app.get_template("index.html")
    return HTMLResponse(template.render(prompts=prompts))


class PromptUpdateRequest(BaseModel):
    system_message: Optional[str] = None
    user_message: str


@app.put("/{prompt_id:path}")
async def update_prompt(request: PromptUpdateRequest, prompt_id: str):
    await update_prompt_db(prompt_id, request.system_message, request.user_message)


@app.delete("/{prompt_id:path}")
async def delete_prompt(prompt_id: str):
    await delete_prompt_db(prompt_id)


@app.get("/{prompt_id:path}")
@app.post("/{prompt_id:path}")
async def use_prompt(
    request: Request,
    prompt_id: str,
    content_type: Optional[str] = Header(None),
):
    prompt = await get_prompt_db(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    if request.method == "GET":
        if content_type == "application/json":
            return prompt
        template = tmpl_env_app.get_template("prompt.html")
        return HTMLResponse(template.render(prompt=prompt))

    input_params = await request.json()

    try:
        system_template = tmpl_env_db.from_string(prompt["system_message"] or "")
        user_template = tmpl_env_db.from_string(prompt["user_message"])
        system_rendered = system_template.render(input_params)
        user_rendered = user_template.render(input_params)
    except TemplateError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except BadPromptUsageError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {  # TODO: actually call gpt
        "system_message": system_rendered,
        "user_message": user_rendered,
    }
