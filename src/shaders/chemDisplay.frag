uniform sampler2D uMap;
void main(){
  vec4 c = texture2D(uMap, gl_FragCoord.xy / resolution.xy);
  gl_FragColor = vec4(c.rgb, 0.8 * length(c.rgb));
}
