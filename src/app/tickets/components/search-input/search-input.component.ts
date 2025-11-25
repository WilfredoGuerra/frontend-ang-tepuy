import { Component, effect, input, output, signal } from '@angular/core';

@Component({
  selector: 'ticket-search-input',
  imports: [],
  templateUrl: './search-input.component.html',
})
export class SearchInputComponent {
  placeholder = input('Buscar');
  value = output<string>();
  debounceTime = input(300);

  inputValue = signal<string>('');

  debounceEffect = effect((onCleanup) => {
    const value = this.inputValue().trim();

    const timeout = setTimeout(() => {
      // console.log('Emitiendo búsqueda:', value);
      this.value.emit(value);
    }, this.debounceTime());

    onCleanup(() => {
      clearTimeout(timeout);
    });
  });
}
