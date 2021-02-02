import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

interface FhxFile {
  file: string | ArrayBuffer,
  headers: string[],
  lines: any[],
}
interface FileChange {
  id: any,
  name: string,
  changes: {
    fieldName: string,
    originalValue: any,
    newValue: any
  }[],
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  originalFile = {} as FhxFile;
  changedFile = {} as FhxFile;
  percentageObserver = new Subject<number>();
  originalFilePercentage: number;
  changedFilePercentage: number;
  headerRow = 0;
  idxCol: string;
  nameCol: string;
  result: FileChange[];
  errorMessage: string;

  async loadOriginalFile(event) {
    if (event.target.files && event.target.files.length > 0) {
      this.originalFile.file = await this.readFile(event.target.files.item(0));
      this.parseFile(this.originalFile);
    }
  }

  async loadChangedFile(event) {
    if (event.target.files && event.target.files.length > 0) {
      this.changedFile.file = await this.readFile(event.target.files.item(0));
      this.parseFile(this.changedFile);
    }
  }

  readFile(file): Promise<string | ArrayBuffer> {
    return new Promise((res) => {
      const reader = new FileReader();
      reader.addEventListener('load', (event) => {
        res(event.target.result);
      });

      reader.readAsText(file, `latin1`);
    })
  }

  parseFile(fhxFile) {
    const lines = fhxFile.file.split(`\n`);
    for(let i = 0; i < this.headerRow; i++) {
      lines.shift();
    }
    fhxFile.headers = lines.shift().split(`;`);
    fhxFile.lines = lines.map(l => {
      const cols = l.split(`;`);
      if (cols[0] === '') return undefined;
      const line = {};
      fhxFile.headers.forEach((h, idx) => {
        line[h] = cols[idx];
      });
      return line;
    });
    if (!fhxFile.lines[fhxFile.lines.length - 1]) {
      fhxFile.lines.pop();
    }
  }

  getTextMessage(line) {
    console.log(line.originalValue, +line.originalValue, isNaN(+line.originalValue));
    if (isNaN(+line.originalValue)) return `Changes <span class="underline">${line.fieldName}</span> from "<span class="bold">${line.originalValue}</span>" to "<span class="bold">${line.newValue}</span>".`;
    if (line.originalValue > line.newValue) {
      return `<span class="red">Decreases</span> <span class="underline">${line.fieldName}</span> from <span class="bold">${line.originalValue}</span> to <span class="bold">${line.newValue}</span>.`;
    } else {
      return `<span class="green">Increases</span> <span class="underline">${line.fieldName}</span> from <span class="bold">${line.originalValue}</span> to <span class="bold">${line.newValue}</span>.`;
    }
  }

  compare() {
    if (!this.originalFile.file || !this.changedFile.file) return;
    if (this.originalFile.headers.length != this.changedFile.headers.length) return this.errorMessage = `Files do not match.`;
    const idKey = this.idxCol || this.originalFile.headers[0];
    this.result = this.originalFile.lines.reduce((acc, curr) => {
      const changedLine = this.changedFile.lines.find(cl => cl[idKey] === curr[idKey]);
      const currChanges = { id: curr[idKey], name: changedLine[this.nameCol], changes: [] } as FileChange;
      this.originalFile.headers
        .filter(h => changedLine[h] !== curr[h])
        .forEach(v => {
          currChanges.changes.push({ fieldName: v, originalValue: curr[v], newValue: changedLine[v] })
        });
        if (currChanges.changes.length > 0) {
          acc.push(currChanges);
        }
      return acc;
    }, [] as FileChange[]);

    if (this.result.length === 0) this.errorMessage = 'There are no differences in these files.';
  }
}
