/** @format */

import React, { useEffect, useState } from 'react'
import {
	useAddress,
	useDisconnect,
	useMetamask,
	useNFTDrop,
} from '@thirdweb-dev/react'
import { GetServerSideProps } from 'next'
import { sanityClient, urlFor } from '../../sanity'
import { Collection } from '../../typtings'
import Link from 'next/link'
import { BigNumber } from 'ethers'
import toast, { Toaster } from 'react-hot-toast'

interface Props {
	collection: Collection
}

function NFTDropPage({ collection }: Props) {
	const [claimedSupply, setClaimSupply] = useState<number>(0)
	const [totalSupply, setTotalSupply] = useState<BigNumber>()
	const [loading, setLoading] = useState<boolean>(true)
	const [priceInEth, setPriceInEth] = useState<string>()
	const nftDrop = useNFTDrop(collection.address)

	useEffect(() => {
		if (!nftDrop) return

		const fetchNFTDropData = async () => {
			const claimed = await nftDrop.getAllClaimed()
			const total = await nftDrop.totalSupply()

			setClaimSupply(claimed.length)
			setTotalSupply(total)

			setLoading(false)
		}

		fetchNFTDropData()
	}, [nftDrop])

	useEffect(() => {
		const fetchPrice = async () => {
			const claimConditions = await nftDrop.claimConditions.getAll()
			setPriceInEth(claimConditions?.[0].currencyMetadata.displayValue)
		}

		fetchPrice()
	}, [nftDrop])

	const mintNft = () => {
		if (!nftDrop || !address) return

		const quantity = 1

		setLoading(true)

		const notification = toast.loading('Minting...', {
			style: {
				background: 'white',
				color: 'green',
				fontWeight: 'bolder',
				fontSize: '17px',
				padding: '20px',
			},
		})

		nftDrop
			.claimTo(address, quantity)
			.then(async (tx) => {
				toast('Congratulations! You Successfully Minted!', {
					duration: 8000,
					style: {
						background: 'green',
						color: 'white',
						fontWeight: 'bolder',
						fontSize: '17px',
						padding: '20px',
					},
				})
			})
			.catch((err) => {
				console.log(err)
				toast('OMG, Something Went Wrong', {
					style: {
						background: 'red',
						color: 'white',
						fontWeight: 'bolder',
						fontSize: '17px',
						padding: '20px',
					},
				})
			})
			.finally(() => {
				setLoading(false)
				toast.dismiss(notification)
			})
	}

	const connectWithMetaMask = useMetamask()
	const address = useAddress()
	const disconnect = useDisconnect()

	return (
		<div className='flex h-screen flex-col lg:grid lg:grid-cols-10'>
			<Toaster position='bottom-center' />
			<div className='bg-gradient-to-br from-cyan-800 to-rose-500 lg:col-span-4'>
				<div className='flex flex-col items-center justify-center lg:min-h-screen'>
					<div
						className='bg-gradient-to-br
                     from-yellow-400 to-purple-600 p-2 rounded-xl'>
						<img
							src={urlFor(collection.previewImage).url()}
							className='w-44 rounded-xl object-cover lg:h-96 lg:w-72'
						/>
					</div>
					<div className='space-y-2 p-5 text-center'>
						<h1 className='text-4xl font-bold text-white'>
							{collection.nftCollectionName}
						</h1>
						<h2 className='text-xl text-gray-300'>{collection.description}</h2>
					</div>
				</div>
			</div>

			<div className='flex flex-1 flex-col p-12 lg:col-span-6'>
				{/* Header */}
				<header className='flex items-center justify-between'>
					<Link href={'/'}>
						<h1 className='w-52 cursor-pointer text-xl font-extralight sm:w-80'>
							The{' '}
							<span
								className='font-extrabold 
                        underline decoration-pink-600/50'>
								KYUMHO
							</span>{' '}
							NFT Market Place
						</h1>
					</Link>
					<button
						onClick={() => (address ? disconnect() : connectWithMetaMask())}
						className='rounded-full bg-rose-400
                     text-white px-4 py-2 lg:px-5 lg:py-2 lg:text-base'>
						{address ? 'Sign Out' : 'Sign In'}
					</button>
				</header>

				<hr className='my-2 border' />
				{address && (
					<p className='text-center text-sm text-rose-400'>
						Your're Logged In With Wallet {address.substring(0, 5)}...
						{address.substring(address.length - 5)}
					</p>
				)}

				<div
					className='mt-10 flex flex-1 flex-col items-center 
                space-y-6 text-center lg:space-y-0 lg:justify-center'>
					<img
						className='w-80 object-cover lg:h-40 pb-10'
						src={urlFor(collection.mainImage).url()}
					/>
					<h1 className='text-3xl font-bold lg:text-5xl lg:font-extrabold'>
						{collection.title}
					</h1>
					{loading ? (
						<p className='pt-2 text-xl text-green-500 animate-pulse'>
							Loading Supply Count...
						</p>
					) : (
						<p className='pt-2 text-xl text-green-500'>
							{claimedSupply} / {totalSupply?.toString()} NFT's Claimed
						</p>
					)}

					{loading && (
						<img
							src='https://cdn.hackernoon.com/images/0*4Gzjgh9Y7Gu8KEtZ.gif'
							className='h-80 w-80 object-contain'
						/>
					)}
				</div>

				<button
					onClick={mintNft}
					disabled={
						loading || claimedSupply === totalSupply?.toNumber() || !address
					}
					className='h-16 w-full bg-red-600 font-bold text-white rounded-full mt-10 disabled:bg-gray-400'>
					{loading ? (
						<>Loading</>
					) : claimedSupply === totalSupply?.toNumber() ? (
						<>SOLD OUT</>
					) : !address ? (
						<>Sign in to Mint</>
					) : (
						<span>Mint NFT ({priceInEth} Eth)</span>
					)}
				</button>
			</div>
		</div>
	)
}

export default NFTDropPage

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
	const query = `*[_type == "collection" && slug.current == $id][0]{
        _id,
        title,
        address,
        description,
        nftCollectionName,
        mainImage{
        asset
      },
        previewImage{
          asset
        },
      slug {
        current
      },
      creator-> {
        _id,
        name,
        address,
        slug{
        current
         },
       },
      }
      `

	const collection = await sanityClient.fetch(query, {
		id: params?.id,
	})

	if (!collection) {
		return {
			notFound: true,
		}
	}

	return {
		props: {
			collection,
		},
	}
}
