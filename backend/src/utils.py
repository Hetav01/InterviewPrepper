# frontend
#     clerk authenticate
#     issue jwt token
#     sent to the backend
    
# backend
#     connect to clerk
#     ask clerk if the jwt token is valid
#     or we can use the network list. we dont need to ask clerk or wait for clerk to respond.
    
#     clerk will return a list of networks that the user is a member of.
#     we can use the network list to determine if the user is a member of the network.
#     if the user is a member of the network, we can return the network id.
#     if the user is not a member of the network, we can return an error.

from fastapi import HTTPException
from clerk_backend_api import Clerk, AuthenticateRequestOptions
import os
from dotenv import load_dotenv

clerk_sdk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

def authenticate_and_get_user_details(request):
    try:
        request_state = clerk_sdk.authenticate_request(
            request,
            AuthenticateRequestOptions(
                authorized_parties=[
                    "http://localhost:5173",
                    "http://localhost:5173"
                ],
                jwt_key= os.getenv("JWT_KEY")
            )
        )
        
        if not request_state.is_signed_in:
            raise HTTPException(status_code=401, detail="Invalid Token")
        
        user_id = request_state.payload.get("sub")
        
        return {"user_id": user_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Invalid Credentials. {str(e)}")
    
    

