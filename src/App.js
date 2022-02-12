import React, { useEffect, useState, useReducer, } from 'react';
import './App.css';
import ReactPlayer from 'react-player';
import AuthComponent from './AuthComponent';
import { Auth, API } from 'aws-amplify';
import { createComment as CreateComment } from './graphql/mutations';
import { listComments as ListComments } from './graphql/queries';
import { onCreateComment as OnCreateComment } from './graphql/subscriptions';

import { HashRouter, Link, Routes, Route, } from 'react-router-dom';

const streamUrl = "https://64d4a97c3716.us-east-1.playback.live-video.net/api/video/v1/us-east-1.159459582783.channel.K3t4OG0IDD2y.m3u8"

function Router() {
  return (
    <HashRouter>
      <nav>
        <Link to="/">Stream</Link>
        <Link to="/auth">Profile</Link>
      </nav>
      <Routes>
        <Route exact path="/" element={<App/>} />
        <Route exact path="/auth" element={<AuthComponent/>} />
      </Routes>
    </HashRouter>
  );
}

const initialState = {
  comments: []
}

function reducer(state, action) {
  switch(action.type) {
    case "SET_COMMENTS":
      return {
        ...state, comments: action.comments
      }
    case "ADD_COMMENT":
      return {
        ...state, comments: [...state.comments, action.comment]
      }
    default:
      return state
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(currentUser => setUser(currentUser))
      .catch(err => console.log({err}));
      fetchComments();
      subscribe();
  }, []);

  function subscribe() {
    API.graphql({
      query: OnCreateComment,
    })
    .subscribe({
      next: async commentData => {
        const { value: { data }} = commentData;
        dispatch({ type: "ADD_COMMENT", comment: data.onCreateComment});
        // commented it out bc we  want to subscribe to our own messages
        // try {
        //   // const user = await Auth.currentAuthenticatedUser();
        //   // if (user.username === data.onCreateComment.owner) {
        //   //   // we do not want to repeat our own message
        //   //   return;
        //   // }
        //   dispatch({ type: "ADD_COMMENT", comment: data.onCreateComment});
        // } catch (err) {
        //   //It means there is no user, we also want to dispatch
        //   dispatch({ type: "ADD_COMMENT", comment: data.onCreateComment});
        // }
      }
    })
  }

  async function fetchComments() {
    const commentData = await API.graphql({
      query: ListComments
    });
    
    dispatch({ type: "SET_COMMENTS", comments: commentData.data.listComments.items})
  }
  async function createComment(e) {
    if (!inputValue) return
    const message = inputValue;
    setInputValue('');
    // I commented this out bc I only want to add comment that has already been pushed to graphql
    // dispatch({
    //   type: "ADD_COMMENT", comment: { message, owner: user.username}
    // });

    await API.graphql({
      query: CreateComment,
      variables: {
        input: { message },
      },
      authMode: "AMAZON_COGNITO_USER_POOLS"
    });
  };
   
  function onChange(e) {
    e.persist();
    setInputValue(e.target.value);
  }

  return (
    <div className="App">
      <div style={{ display: "flex"}}>
        <div style={{ width: 900, border: "1px solid black" }}>
          <ReactPlayer 
            url = {streamUrl}
            width = "100%"
            height = "100%"
            playing
          />
        </div>
        <div style={{ width:300, border: "1px solid black"}}>
          {
            user && (
              <div>
                <input value={inputValue} onChange={onChange} placeholder="Comment here"/>
                <button
                  onClick={createComment}>Comment</button>
              </div>
            )
          }
          {
            state.comments.map((comment, index) => (
              <div key={index}>
                <p> {comment.message}</p>
                <span>From: {comment.owner}</span>
              </div>
            ))
          }
        </div>
    </div>
    </div>
  );
}

export default Router;
