// Criação de DOM segura: todo texto entra como nó de texto, nunca como HTML.

export function el(tag, props = {}, ...filhos) {
  const no = document.createElement(tag);
  for (const [chave, valor] of Object.entries(props)) {
    if (valor == null || valor === false) continue;
    if (chave === 'class') no.className = valor;
    else if (chave === 'text') no.textContent = valor;
    else if (chave.startsWith('on') && typeof valor === 'function') no.addEventListener(chave.slice(2).toLowerCase(), valor);
    else no.setAttribute(chave, valor === true ? '' : String(valor));
  }
  for (const filho of filhos.flat()) {
    if (filho == null || filho === false) continue;
    no.append(filho);
  }
  return no;
}

export function montar(container, ...filhos) {
  container.replaceChildren();
  for (const filho of filhos.flat()) {
    if (filho == null || filho === false) continue;
    container.append(filho);
  }
  return container;
}
