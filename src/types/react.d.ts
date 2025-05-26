declare module 'react' {
  // Extend the React module with hooks and component types
  export function useState<T>(initialState: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>];
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function useRef<T>(initialValue: T): React.MutableRefObject<T>;
  export function useRef<T = undefined>(): React.MutableRefObject<T | undefined>;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T;
  export function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined): T;
  
  export type FC<P = {}> = React.FunctionComponent<P>;
  export type ReactElement<P = any> = React.ReactElement<P>;
  export type ReactNode = React.ReactNode;
  export const Fragment: React.ExoticComponent<{children?: React.ReactNode}>;
  export const StrictMode: React.ExoticComponent<{children?: React.ReactNode}>;
  
  // Ensure other React types are properly exported
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type DependencyList = ReadonlyArray<any>;
  export type EffectCallback = () => void | (() => void);
  export type MutableRefObject<T> = { current: T };

  export interface FunctionComponent<P = {}> {
    (props: P & { children?: React.ReactNode }): React.ReactElement<any, any> | null;
    displayName?: string;
    defaultProps?: Partial<P>;
  }
}

// Augment the global namespace with React types needed by JSX
declare global {
  namespace React {
    type ReactNode = string | number | boolean | null | undefined | ReactElement | ReactFragment | ReactPortal;
    interface ReactElement<P = any> {
      type: any;
      props: P;
      key: string | number | null;
    }
    type ReactFragment = {} | ReactNodeArray;
    interface ReactNodeArray extends Array<ReactNode> {}
    interface ReactPortal {
      key: string | number | null;
      children: ReactNode;
    }
    type RefObject<T> = { readonly current: T | null };
    type MutableRefObject<T> = { current: T };
    type DependencyList = ReadonlyArray<any>;
    type EffectCallback = () => void | (() => void);
    interface ExoticComponent<P = {}> {
      (props: P): ReactElement | null;
    }
  }
}
