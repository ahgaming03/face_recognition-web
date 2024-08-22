{ pkgs }: {
  deps = [
    pkgs.deploy-rs
    pkgs.glibcLocales
    pkgs.libGLU
    pkgs.libGL
    pkgs.xsimd
    pkgs.pkg-config
    pkgs.libxcrypt
    pkgs.cowsay
  ];
}