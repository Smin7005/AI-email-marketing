'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMAIL_TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
];

const formSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: 'Campaign name must be at least 2 characters.',
    })
    .max(100, {
      message: 'Campaign name must be less than 100 characters.',
    }),
  serviceDescription: z
    .string()
    .min(10, {
      message: 'Service description must be at least 10 characters.',
    })
    .max(500, {
      message: 'Service description must be less than 500 characters.',
    }),
  emailTone: z.string({
    message: 'Please select an email tone.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface CampaignFormProps {
  onSubmit: (values: FormValues) => Promise<void> | void;
  isLoading?: boolean;
}

export function CampaignForm({ onSubmit, isLoading = false }: CampaignFormProps) {
  const [charCount, setCharCount] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      serviceDescription: '',
      emailTone: '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setCharCount(e.target.value.length);
    form.setValue('serviceDescription', e.target.value);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Q1 Outreach for IT Companies"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Choose a descriptive name for your campaign.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Description</FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="Describe the service or product you want to promote..."
                    className="min-h-[120px] resize-y"
                    {...field}
                    onChange={handleDescriptionChange}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                    {charCount}/500
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Provide details about what you're offering. This will help AI
                generate personalized emails.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emailTone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Tone</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the tone for your emails" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white dark:bg-gray-900">
                  {EMAIL_TONES.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose how you want your emails to sound to prospects.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Campaign...
            </>
          ) : (
            'Create Campaign'
          )}
        </Button>
      </form>
    </Form>
  );
}
