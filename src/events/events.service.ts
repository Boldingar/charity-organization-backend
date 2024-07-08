import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { Department } from 'src/departments/entities/department.entity';
import { Beneficiary } from 'src/beneficiaries/entities/beneficiary.entity';
import { Volunteer } from 'src/volunteers/entities/volunteer.entity';
import { Staff } from 'src/staff/entities/staff.entity';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(Beneficiary)
    private beneficiaryRepository: Repository<Beneficiary>,
    @InjectRepository(Volunteer)
    private volunteerRepository: Repository<Volunteer>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = new Event();
    event.name = createEventDto.name;
    event.date = createEventDto.date;
    event.fundingAmount = createEventDto.fundingAmount;

    // Fetch the Department entity
    event.department = await this.departmentRepository.findOneBy({ name: createEventDto.department });
    if (!event.department) {
      throw new NotFoundException('Department not found');
    }

    // Fetch the Beneficiaries entities
    event.beneficiaries = await this.beneficiaryRepository.findByIds(createEventDto.beneficiariesSSN);
    if (event.beneficiaries.length !== createEventDto.beneficiariesSSN.length) {
      throw new NotFoundException('One or more Beneficiaries not found');
    }

    // Fetch the Volunteers entities
    event.volunteers = await this.volunteerRepository.findByIds(createEventDto.volunteersSSN);
    if (event.volunteers.length !== createEventDto.volunteersSSN.length) {
      throw new NotFoundException('One or more Volunteers not found');
    }

    // Fetch the Staff entity
    event.staff = await this.staffRepository.findOneBy({ ssn: createEventDto.organizerSSN });
    if (!event.staff) {
      throw new NotFoundException('Organizer not found');
    }

    return await this.eventRepository.save(event);
  }

  async findAll(): Promise<Event[]> {
    return await this.eventRepository.find();
  }

  async findOne(id: number): Promise<Event> {
    return await this.eventRepository.findOne({ where: { id } });
  }
  async update(id: number, updateEventDto: UpdateEventDto) {
    const event = await this.findOne(id);

    if (!event) {
      throw new NotFoundException();
    }

    Object.assign(event, updateEventDto);

    return await this.eventRepository.save(event);
  }

  async remove(id: number) {
    const event = await this.findOne(id);

    if (!event) {
      throw new NotFoundException();
    }

    return await this.eventRepository.remove(event);
  }
}