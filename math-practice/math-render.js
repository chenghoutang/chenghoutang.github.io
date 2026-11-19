(() => {
 'use strict';
 window.renderPracticeMath=element=>{
  if(!window.renderMathInElement)return;
  window.renderMathInElement(element,{
   delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}],
   throwOnError:false,strict:'ignore',trust:false
  });
 };
})();
