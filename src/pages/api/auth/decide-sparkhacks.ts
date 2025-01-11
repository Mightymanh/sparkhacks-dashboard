import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { app, db } from "../../../firebase/server";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {

  let email = ""

  // check token and session alive
  try {
    const auth = getAuth(app);

    // no session or invalid session will be redirected to sign in page
    const sessionCookieObj = cookies.get("__session");
    if (!sessionCookieObj) {
      return new Response(
        "No token found", {status: 401}
      )
    }
    const sessionCookie = sessionCookieObj.value;
    const decodedCookie = await auth.verifySessionCookie(sessionCookie);
    if (!decodedCookie) {
      return new Response (
        "Invalid token", { status: 401 }
      )
    }

    email = decodedCookie.email || ""
  }
  catch (err) {
    console.error("Something is wrong with verifying cookie", err)
    return new Response("Session expired. Please sign out and sign in again", { status: 500 })
  }

  // TODO: check if user already accept or withdraw

  // update appResult
  try {
    const formData = await request.formData()
    const action = formData.get("action")?.toString() || "" // should be either accept or withdraw

    // invalid action
    if (action !== "userAccepted" && action !== "declined") {
      return new Response("Invalid action", { status: 400 })
    }
    
    const res = await db.collection("Forms").doc(email).update({
      appStatus: action
    })
    
    return new Response(`Successfully ${action} the hackathon`)
  }
  catch (err) {
    console.error(err)
    return new Response("Something is wrong with server", { status: 500 })
  }
}