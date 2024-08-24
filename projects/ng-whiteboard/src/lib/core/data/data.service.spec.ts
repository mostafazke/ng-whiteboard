import { DataService } from './data.service';

describe('SvgService', () => {
  let service: DataService;

  beforeEach(() => {
    service = new DataService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
