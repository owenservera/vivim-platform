declare module 'feather-icons' {
  export interface FeatherAttributes {
    [key: string]: string | number;
  }

  export interface FeatherIcon {
    name: string;
    contents: string;
    tags: string[];
    attrs: FeatherAttributes;
    toSvg: (attrs?: FeatherAttributes) => string;
  }

  export interface Feather {
    icons: { [key: string]: FeatherIcon };
    toSvg: (name: string, attrs?: FeatherAttributes) => string;
    replace: (attrs?: FeatherAttributes) => void;
  }

  const feather: Feather;
  export default feather;
}
