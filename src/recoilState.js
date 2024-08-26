import { atom } from 'recoil';

export const blobVideoState = atom({
    key: 'blobVideoState', // unique ID (with respect to other atoms/selectors)
    default: null, // default value (aka initial value)
});
