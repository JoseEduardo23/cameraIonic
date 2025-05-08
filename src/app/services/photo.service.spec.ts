import { TestBed } from '@angular/core/testing';

import { PhotoServices } from './photo.service';

describe('PhotoService', () => {
  let service: PhotoServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhotoServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
