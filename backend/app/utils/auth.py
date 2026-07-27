from fastapi import Request  # <-- Add this line

async def get_current_user(request: Request):
    # Replace with the actual UUID from Supabase
    return {
        "id": "54b3f094-19d3-4484-aa1b-b6b66ab2c9a6",
        "email": "test@mail.com"
    }