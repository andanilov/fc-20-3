import { createSlice } from "@reduxjs/toolkit";
import commentService from "../services/comment.service";
import { nanoid } from "nanoid";

const commentsSlice = createSlice({
    name: "comments",
    initialState: {
        entities: null,
        isLoading: true,
        error: null
    },
    reducers: {
        commentsRequested: (state) => {
            state.isLoading = true;
        },
        commentsReceived: (state, action) => {
            state.entities = action.payload;
            state.isLoading = false;
        },
        commentsRequestFailed: (state, action) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        commentCreate: (state, action) => {
            state.entities.push(action.payload);
        },
        commentRemove: (state, action) => (
            { ...state, entities: state.entities.filter(({ _id }) => _id !== action.payload) }
        )
    }
});

const { reducer: commentsReducer, actions } = commentsSlice;
const { commentsRequested, commentsReceived, commentsRequestFailed, commentCreate, commentRemove } = actions;

export const loadCommentsList = (userId) => async (dispatch) => {
    dispatch(commentsRequested());
    try {
        const { content } = await commentService.getComments(userId);
        dispatch(commentsReceived(content));
    } catch (error) {
        dispatch(commentsRequestFailed(error.message));
    }
};

export const createComment = (data, userId) => async (dispatch) => {
    console.log("createComment", data, userId);
    try {
        const { content } = await commentService.createComment({
            ...data,
            _id: nanoid(),
            pageId: userId,
            created_at: Date.now(),
            userId: userId
        });
        dispatch(commentCreate(content));
    } catch (error) {
        dispatch(commentsRequestFailed(error.message));
    }
};

export const removeComment = (id) => async (dispatch) => {
    try {
        await commentService.removeComment(id);
        dispatch(commentRemove(id));
    } catch (error) {
        dispatch(commentsRequestFailed(error.message));
    }
};

export const getComments = () => (state) => state.comments.entities;
export const getCommentsLoadingStatus = () => (state) =>
    state.comments.isLoading;

export default commentsReducer;
