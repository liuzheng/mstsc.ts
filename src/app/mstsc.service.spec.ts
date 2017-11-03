import { TestBed, inject } from '@angular/core/testing';

import { Mstsc } from './mstsc.service';

describe('Mstsc', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Mstsc]
    });
  });

  it('should be created', inject([Mstsc], (service: Mstsc) => {
    expect(service).toBeTruthy();
  }));
});
