import React from 'react';
import { Auth } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'

function AuthComponent() {
    const [user, updateUser] = React.useState(null);
    React.useEffect(() => {
        Auth.currentAuthenticatedUser()
            .then(currentUser => updateUser(currentUser))
            .catch(err => console.log({ err }))
    }, []);

    return (
        <div>
            {
                user && <h3>Hello {user.userName} </h3>
            }
            <AmplifySignOut />
        </div>
    )
}

export default withAuthenticator(AuthComponent)