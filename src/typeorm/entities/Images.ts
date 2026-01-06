import { PrimaryGeneratedColumn, Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { Product } from "./Product";
import { Field, ObjectType } from "@nestjs/graphql";

@Entity()
@ObjectType()
export class Images{
    @PrimaryGeneratedColumn('uuid')
    @Field()
    imageId: string

    @Column({unique:true})
    @Field()
    fileName: string

    @Column()
    @Field()
    uploadedAt: Date

    @Column()
    @Field()
    mimeType: string

    @Column()
    @Field()
    fileSize: string

    @Column({nullable:true})
    @Field()
    filepath?: string

    @Column({nullable:true})
    @Field()
    s3FileUrl?: string //this url is the key of object/file in the s3 bucket
    
    @Column({nullable:true})
    @Field()
    s3Key?: string // a unique key to be used by clients for downloads, deletes or updates

    @Field(()=>Product)
    @ManyToOne(()=>Product,(prod)=>prod.images)
    @JoinColumn()
    Product: Product
}