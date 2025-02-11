/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef mozilla_dom_BrowsingContextGroup_h
#define mozilla_dom_BrowsingContextGroup_h

#include "mozilla/dom/BrowsingContext.h"
#include "mozilla/dom/ContentParent.h"
#include "mozilla/StaticPtr.h"
#include "nsHashKeys.h"
#include "nsTArray.h"
#include "nsTHashtable.h"
#include "nsWrapperCache.h"

namespace mozilla {
namespace dom {

class BrowsingContext;

// A BrowsingContextGroup represents the Unit of Related Browsing Contexts in
// the standard. This object currently serves roughly the same purpose as the
// TabGroup class which already exists, and at some point will likely merge with
// it.
//
// A BrowsingContext may not hold references to other BrowsingContext objects
// which are not in the same BrowsingContextGroup.
class BrowsingContextGroup final : public nsWrapperCache {
 public:
  NS_INLINE_DECL_CYCLE_COLLECTING_NATIVE_REFCOUNTING(BrowsingContextGroup)
  NS_DECL_CYCLE_COLLECTION_SCRIPT_HOLDER_NATIVE_CLASS(BrowsingContextGroup)

  typedef nsTHashtable<nsRefPtrHashKey<ContentParent>> ContentParents;

  // Interact with the list of BrowsingContexts.
  bool Contains(BrowsingContext* aContext);
  void Register(BrowsingContext* aContext);
  void Unregister(BrowsingContext* aContext);

  // Interact with the list of ContentParents
  void Subscribe(ContentParent* aOriginProcess);
  void Unsubscribe(ContentParent* aOriginProcess);

  ContentParents::Iterator ContentParentsIter() { return mSubscribers.Iter(); }

  // Get a reference to the list of toplevel contexts in this
  // BrowsingContextGroup.
  BrowsingContext::Children& Toplevels() { return mToplevels; }
  void GetToplevels(BrowsingContext::Children& aToplevels) {
    aToplevels.AppendElements(mToplevels);
  }

  nsISupports* GetParentObject() const;
  JSObject* WrapObject(JSContext* aCx,
                       JS::Handle<JSObject*> aGivenProto) override;

  BrowsingContextGroup() = default;

 private:
  friend class CanonicalBrowsingContext;

  ~BrowsingContextGroup();

  // A BrowsingContextGroup contains a series of BrowsingContext objects. They
  // are addressed using a hashtable to avoid linear lookup when adding or
  // removing elements from the set.
  nsTHashtable<nsRefPtrHashKey<BrowsingContext>> mContexts;

  // The set of toplevel browsing contexts in the current BrowsingContextGroup.
  BrowsingContext::Children mToplevels;

  ContentParents mSubscribers;
};

}  // namespace dom
}  // namespace mozilla

#endif  // !defined(mozilla_dom_BrowsingContextGroup_h)
