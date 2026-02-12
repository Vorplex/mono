export type PackageJsonExports =
    | string
    | Record<
          string,
          | {
                import?: string;
                browser?: string;
                require?: string;
                default?: string;
            }
          | string
      >
    | PackageJsonExports[];

export interface PackageJson {
    name: string;
    version: string;
    main?: string;
    module?: string;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    types?: string;
    typings?: string;
    typescript?: string;
    browser?: string | Record<string, string | false>;
    exports?: PackageJsonExports | Record<string, PackageJsonExports>;
}
