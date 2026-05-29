import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  type PersistConfig,
} from "redux-persist";
import { encryptTransform } from "redux-persist-transform-encrypt";
import authReducer from "@/store/slice/auth.slice";

// Inline web-storage adapter — replaces `redux-persist/lib/storage` so we
// don't depend on its CJS default-export shape, which Vite 8 / Rolldown
// interops differently than Vite 7 / Rollup did (broken `storage.getItem`
// at runtime). Same Promise-wrapped localStorage behavior with the same
// noop SSR fallback the library uses internally.
const noopStorage = {
  getItem: (): Promise<string | null> => Promise.resolve(null),
  setItem: (_key: string, value: string): Promise<string> =>
    Promise.resolve(value),
  removeItem: (): Promise<void> => Promise.resolve(),
};

const storage =
  typeof window !== "undefined" && "localStorage" in window
    ? {
        getItem: (key: string): Promise<string | null> =>
          Promise.resolve(window.localStorage.getItem(key)),
        setItem: (key: string, value: string): Promise<string> => {
          window.localStorage.setItem(key, value);
          return Promise.resolve(value);
        },
        removeItem: (key: string): Promise<void> => {
          window.localStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : noopStorage;

const rootReducer = combineReducers({
  auth: authReducer,
  // Add other reducers here as needed
});

type RootReducerState = ReturnType<typeof rootReducer>;

const encryptKey = import.meta.env.VITE_PERSIST_ENCRYPT_KEY;

// Fail closed: if no encryption key is configured, do not persist auth
// state. Plaintext tokens in localStorage are worse than no persistence.
const persistConfig: PersistConfig<RootReducerState> = encryptKey
  ? {
      key: "root",
      version: 1,
      storage,
      whitelist: ["auth"],
      transforms: [
        encryptTransform({
          secretKey: encryptKey,
          onError: (error) => {
            // eslint-disable-next-line no-console
            console.error("Persist decrypt failed (key rotated?):", error);
          },
        }),
      ],
    }
  : {
      key: "root",
      version: 1,
      storage,
      whitelist: [],
    };

if (!encryptKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "VITE_PERSIST_ENCRYPT_KEY is not set — auth state will not be persisted across reloads.",
  );
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
