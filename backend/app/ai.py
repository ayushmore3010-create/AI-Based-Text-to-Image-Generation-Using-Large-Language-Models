import base64
import html

import httpx

from .config import settings


def demo_enhancement(prompt: str) -> str:
    return f"Cinematic editorial artwork of {prompt}, rich environmental detail, intentional composition, soft volumetric lighting, high fidelity, refined color palette"


async def enhance_prompt(prompt: str) -> str:
    if not settings.openai_api_key:
        return demo_enhancement(prompt)
    headers = {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}
    payload = {"model": settings.openai_text_model, "messages": [{"role": "system", "content": "Rewrite image prompts with vivid subject, setting, light, lens, composition, and style details. Return only the final prompt."}, {"role": "user", "content": prompt}], "temperature": 0.8}
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()


def demo_image(prompt: str) -> str:
    title = html.escape(prompt[:42])
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#0b1e2d"/><stop offset=".55" stop-color="#184e5d"/><stop offset="1" stop-color="#d06b3c"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/><circle cx="790" cy="220" r="140" fill="#f8d89a" opacity=".82"/><path d="M0 730 Q280 540 470 730 T1024 680 V1024 H0Z" fill="#08131b" opacity=".8"/><text x="70" y="880" fill="white" font-family="Georgia" font-size="34">DEMO GENERATION</text><text x="70" y="930" fill="#d7e6e3" font-family="Arial" font-size="22">{title}</text></svg>'''
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


async def generate_image(prompt: str) -> str:
    if not settings.openai_api_key:
        return demo_image(prompt)
    headers = {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}
    payload = {"model": settings.openai_image_model, "prompt": prompt, "size": "1024x1024", "quality": "standard", "n": 1}
    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post("https://api.openai.com/v1/images/generations", headers=headers, json=payload)
        response.raise_for_status()
        return response.json()["data"][0]["url"]