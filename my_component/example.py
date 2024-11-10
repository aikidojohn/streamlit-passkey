import json

import streamlit as st

from my_component import my_component
from my_component.passkey import generate_passkey_registration, verify_passkey_registration

# Add some test code to play with the component while it's in development.
# During development, we can run this just as we would any other Streamlit
# app: `$ streamlit run my_component/example.py`

st.subheader("Component with constant args")

# Create an instance of our component with a constant `name` arg, and
# print its output value.
if "create_options" not in st.session_state.keys():
    st.session_state["create_options"] = generate_passkey_registration("john@getcatch.ai")
print(st.session_state["create_options"])
registration_result = my_component("World", st.session_state["create_options"])
if registration_result != "":
    print(registration_result)
    reg = json.loads(registration_result)
    verification = verify_passkey_registration(reg)
    print(verification)

print(registration_result)
st.markdown("You've registered: %s" % registration_result)

st.markdown("---")