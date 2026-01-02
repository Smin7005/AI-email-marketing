import { FolderPlus, ArrowRight } from 'lucide-react';
import { getUserCollections } from '@/lib/actions/collections';
import CollectionCard from '@/components/collections/CollectionCard';
import Link from 'next/link';

interface Collection {
  id: string;
  name: string;
  created_at: string;
  item_count: number;
}

export default async function CollectionsPage() {
  const collections: Collection[] = await getUserCollections();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Collections</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize and manage your saved business leads
          </p>
        </div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FolderPlus className="h-5 w-5" />
          Create New Collection
        </Link>
      </div>

      {/* Content */}
      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FolderPlus className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Create your first collection
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Start by browsing business leads and saving them to a collection. You can organize leads by location, industry, or any criteria that makes sense for your business.
          </p>
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Browse Leads
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      )}
    </div>
  );
}
