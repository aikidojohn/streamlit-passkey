import { Streamlit, RenderData } from "streamlit-component-lib"
//import { create } from "node:domain"

  function base64ToArrayBuffer(encoded: string): Uint8Array {
    var binaryString = window.parent.atob(encoded.replaceAll("_","/").replaceAll("-","+"));
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  function arrayBufferToBase64(arrayBuffer: ArrayBuffer | null): string | null {
    if (arrayBuffer == null) {
      return null;
    }
    const charCodes = Array.from(new Uint8Array(arrayBuffer)).map(byte => String.fromCharCode(byte));
    const string = charCodes.join('');

    return btoa(string).replaceAll("/", "_").replaceAll("+", "-");
  }

  function handleCreateCredentials(creds: Credential | null) {
    console.log("done");
    const pub = creds as PublicKeyCredential
    const response = pub.response as AuthenticatorAttestationResponse
    const result = {
      "id": pub.id,
      "rawId": arrayBufferToBase64(pub.rawId),
      "type": pub.type,
      "response": {
        "attestationObject": arrayBufferToBase64(response.attestationObject),
        "clientDataJSON": arrayBufferToBase64(response.clientDataJSON),
        "authenticatorData": arrayBufferToBase64(response.getAuthenticatorData()),
        "publicKey": arrayBufferToBase64(response.getPublicKey()),
        "publicKeyAlgorithm": response.getPublicKeyAlgorithm(),
        "transports": response.getTransports()
      }
    }
    const jsonResult= JSON.stringify(result)
    console.log(jsonResult);
    Streamlit.setComponentValue(jsonResult)
  }

// Add text and a button to the DOM. (You could also add these directly
// to index.html.)
const span = document.body.appendChild(document.createElement("span"))
const textNode = span.appendChild(document.createTextNode(""))
const button = span.appendChild(document.createElement("button"))
button.textContent = "Click Me!"

// Add a click handler to our button. It will send data back to Streamlit.
let numClicks = 0
let isFocused = false
let mediationAvailable = false
let create_options = ""

function checkMediation() {
  if (
      typeof window.PublicKeyCredential !== 'undefined'
      && typeof window.PublicKeyCredential.isConditionalMediationAvailable === 'function'
    ) {
    PublicKeyCredential.isConditionalMediationAvailable().then( (available:boolean) => {
      Streamlit.setComponentValue(available)
    })
  }
}

button.onclick = function(): void {
  // Increment numClicks, and pass the new value back to
  // Streamlit via `Streamlit.setComponentValue`.
  console.log(create_options)
  console.log("registering");
  const options = JSON.parse(create_options);
  options["challenge"] = base64ToArrayBuffer(options["challenge"]);
  options["user"]["id"] = base64ToArrayBuffer(options["user"]["id"]);
  const parentWindow = window.parent;
  window.parent.setTimeout(() => {
    console.log("calling on parent window");
    parentWindow.navigator.credentials.create({publicKey: options}).then(handleCreateCredentials);
    //numClicks += 1
    //Streamlit.setComponentValue(numClicks)
  }, 0);
}

button.onfocus = function(): void {
  isFocused = true
}

button.onblur = function(): void {
  isFocused = false
}

/**
 * The component's render function. This will be called immediately after
 * the component is initially loaded, and then again every time the
 * component gets new data from Python.
 */
function onRender(event: Event): void {
  // Get the RenderData from the event
  const data = (event as CustomEvent<RenderData>).detail

  // Maintain compatibility with older versions of Streamlit that don't send
  // a theme object.
  if (data.theme) {
    // Use CSS vars to style our button border. Alternatively, the theme style
    // is defined in the data.theme object.
    const borderStyling = `1px solid var(${
      isFocused ? "--primary-color" : "gray"
    })`
    button.style.border = borderStyling
    button.style.outline = borderStyling
  }

  // Disable our button if necessary.
  button.disabled = data.disabled

  // RenderData.args is the JSON dictionary of arguments sent from the
  // Python script.
  let name = data.args["name"]
  create_options = data.args["create_options"]

  // Show "Hello, name!" with a non-breaking space afterwards.
  textNode.textContent = `Hello, ${name}! ` + String.fromCharCode(160)

  // We tell Streamlit to update our frameHeight after each render event, in
  // case it has changed. (This isn't strictly necessary for the example
  // because our height stays fixed, but this is a low-cost function, so
  // there's no harm in doing it redundantly.)
  Streamlit.setFrameHeight()
}

// Attach our `onRender` handler to Streamlit's render event.
Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender)

// Tell Streamlit we're ready to start receiving data. We won't get our
// first RENDER_EVENT until we call this function.
Streamlit.setComponentReady()

// Finally, tell Streamlit to update our initial height. We omit the
// `height` parameter here to have it default to our scrollHeight.
Streamlit.setFrameHeight()
